"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { getAuthorizedAdmin } from "@/server/auth/admin";
import { createAdminClient } from "@/server/supabase/admin";

/**
 * The single to-do list (docs/kaiku-hq-design.md §4.10) — tasks attached to
 * the record the work is about, not a bare list floating on its own.
 *
 * Three tabs computed from one table rather than three queries: `open` tasks
 * split into Today (due today, overdue, or an expired snooze) and Upcoming
 * (due later or no date at all) by comparing dates in JS, because Postgres
 * would need the same "is this actually due" logic duplicated in SQL.
 */

export type TaskLinkType =
  "order" | "supplier" | "ticket" | "product" | "customer";

export interface HqTask {
  id: string;
  title: string;
  detail: string | null;
  priority: "low" | "normal" | "high";
  dueDate: string | null;
  snoozedUntil: string | null;
  status: "open" | "done" | "snoozed";
  checklist: { text: string; done: boolean }[];
  createdAt: string;
  completedAt: string | null;
  link: { type: TaskLinkType; id: string } | null;
}

export interface TaskLists {
  today: HqTask[];
  upcoming: HqTask[];
  done: HqTask[];
}

const EMPTY: TaskLists = { today: [], upcoming: [], done: [] };

interface Row {
  id: string;
  title: string;
  detail: string | null;
  priority: "low" | "normal" | "high";
  due_date: string | null;
  snoozed_until: string | null;
  status: "open" | "done" | "snoozed";
  checklist: unknown;
  created_at: string;
  completed_at: string | null;
  order_id: string | null;
  supplier_id: string | null;
  ticket_id: string | null;
  product_slug: string | null;
  customer_email: string | null;
}

function toTask(row: Row): HqTask {
  const link: HqTask["link"] = row.order_id
    ? { type: "order", id: row.order_id }
    : row.supplier_id
      ? { type: "supplier", id: row.supplier_id }
      : row.ticket_id
        ? { type: "ticket", id: row.ticket_id }
        : row.product_slug
          ? { type: "product", id: row.product_slug }
          : row.customer_email
            ? { type: "customer", id: row.customer_email }
            : null;

  return {
    id: row.id,
    title: row.title,
    detail: row.detail,
    priority: row.priority,
    dueDate: row.due_date,
    snoozedUntil: row.snoozed_until,
    status: row.status,
    checklist: Array.isArray(row.checklist)
      ? (row.checklist as { text: string; done: boolean }[])
      : [],
    createdAt: row.created_at,
    completedAt: row.completed_at,
    link,
  };
}

const SELECT =
  "id, title, detail, priority, due_date, snoozed_until, status, checklist, created_at, completed_at, order_id, supplier_id, ticket_id, product_slug, customer_email";

export async function listTasks(): Promise<TaskLists> {
  if (!(await getAuthorizedAdmin())) return EMPTY;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("tasks")
    .select(SELECT)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    // Same fail-soft posture as hq-attention.ts: a migration not yet run must
    // not break the page, just show it empty.
    console.warn("[tasks] could not read tasks:", error.message);
    return EMPTY;
  }

  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setHours(23, 59, 59, 999);

  const today: HqTask[] = [];
  const upcoming: HqTask[] = [];
  const done: HqTask[] = [];

  for (const row of data ?? []) {
    const task = toTask(row);
    if (task.status === "done") {
      done.push(task);
      continue;
    }

    // A snoozed task whose wake time has passed behaves exactly like an open
    // one due today — there is no "still asleep" state a snooze can hide in.
    const snoozeExpired =
      task.status === "snoozed" &&
      task.snoozedUntil !== null &&
      new Date(task.snoozedUntil).getTime() <= now;

    if (task.status === "snoozed" && !snoozeExpired) continue;

    const due = task.dueDate ? new Date(task.dueDate) : null;
    const isTodayOrOverdue =
      due !== null && due.getTime() <= endOfToday.getTime();

    if (isTodayOrOverdue || snoozeExpired) today.push(task);
    else upcoming.push(task);
  }

  done.sort(
    (a, b) =>
      new Date(b.completedAt ?? b.createdAt).getTime() -
      new Date(a.completedAt ?? a.createdAt).getTime(),
  );
  done.splice(100); // the Done tab is a recent record, not an archive browser

  return { today, upcoming, done };
}

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/**
 * Quick-add parsing: "call Mercia about pallet damage friday" → title stripped
 * of the trailing date word, due date set to the next occurrence of it.
 * Deliberately narrow — today/tomorrow/a weekday name, at the end of the
 * string only — a task title is free text and a parser greedy enough to catch
 * every date-shaped phrase inside it would also mangle titles that just
 * happen to contain one.
 */
function parseQuickAdd(input: string): {
  title: string;
  dueDate: string | null;
} {
  const trimmed = input.trim();
  const match = trimmed.match(/\s+(today|tomorrow|[a-z]+)$/i);
  if (!match) return { title: trimmed, dueDate: null };

  const word = match[1]!.toLowerCase();
  const today = new Date();
  today.setHours(9, 0, 0, 0);

  let due: Date | null = null;
  if (word === "today") {
    due = today;
  } else if (word === "tomorrow") {
    due = new Date(today);
    due.setDate(due.getDate() + 1);
  } else {
    const target = WEEKDAYS.indexOf(word);
    if (target !== -1) {
      due = new Date(today);
      const diff = (target - due.getDay() + 7) % 7 || 7;
      due.setDate(due.getDate() + diff);
    }
  }

  if (!due) return { title: trimmed, dueDate: null };
  return {
    title: trimmed.slice(0, match.index).trim(),
    dueDate: due.toISOString(),
  };
}

export async function createTask(formData: FormData): Promise<void> {
  if (!(await getAuthorizedAdmin())) return;
  const raw = String(formData.get("quickAdd") ?? "").trim();
  if (!raw) return;

  const { title, dueDate } = parseQuickAdd(raw);
  if (!title) return;

  const admin = createAdminClient();
  await admin.from("tasks").insert({
    title,
    due_date: dueDate,
    priority: "normal",
  });
  revalidatePath("/admin/tasks");
}

export async function completeTask(formData: FormData): Promise<void> {
  if (!(await getAuthorizedAdmin())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const admin = createAdminClient();
  const { data: task } = await admin
    .from("tasks")
    .select("order_id, title")
    .eq("id", id)
    .single();

  await admin
    .from("tasks")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", id);

  // The order's timeline should show the work, not just the task list.
  if (task?.order_id) {
    await admin.from("order_events").insert({
      order_id: task.order_id,
      type: "note",
      title: `Task completed — ${task.title}`,
      actor: "admin",
    });
  }
  revalidatePath("/admin/tasks");
}

export async function reopenTask(formData: FormData): Promise<void> {
  if (!(await getAuthorizedAdmin())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const admin = createAdminClient();
  await admin
    .from("tasks")
    .update({ status: "open", completed_at: null })
    .eq("id", id);
  revalidatePath("/admin/tasks");
}

export async function snoozeTask(formData: FormData): Promise<void> {
  if (!(await getAuthorizedAdmin())) return;
  const id = String(formData.get("id") ?? "");
  const until = String(formData.get("snoozedUntil") ?? "");
  if (!id || !until) return;

  const admin = createAdminClient();
  await admin
    .from("tasks")
    .update({ status: "snoozed", snoozed_until: new Date(until).toISOString() })
    .eq("id", id);
  revalidatePath("/admin/tasks");
}
