import Link from "next/link";

import { toRoute } from "@/components/ui/app-link";
import {
  completeTask,
  createTask,
  type HqTask,
  listTasks,
  reopenTask,
  snoozeTask,
  type TaskLinkType,
} from "@/server/actions/hq-tasks";

/**
 * The single to-do list. Design: docs/kaiku-hq-design.md §4.10.
 *
 * Three tabs over one query — Today (due, overdue, or a snooze that has woken
 * up) · Upcoming · Done — chosen with `?tab=`, a server-rendered tab rather
 * than client state, in keeping with how the rest of HQ is built (Orders,
 * Dashboard: no client component unless something genuinely needs one).
 */
export default async function AdminTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab = rawTab === "upcoming" || rawTab === "done" ? rawTab : "today";
  const lists = await listTasks();
  const rows = lists[tab];

  return (
    <section className="hq-panel">
      <div className="hq-panel-head">
        <span>Tasks</span>
        <span className="hq-num" style={{ color: "var(--hq-faint)" }}>
          {lists.today.length} today · {lists.upcoming.length} upcoming
        </span>
      </div>

      <form
        action={createTask}
        className="flex items-center gap-2 px-2.5 py-2"
        style={{ borderBottom: "1px solid var(--hq-line)" }}
      >
        <input
          type="text"
          name="quickAdd"
          placeholder="call Mercia about pallet damage friday"
          className="flex-1 border px-2 py-1 text-[12px]"
          autoComplete="off"
        />
        <button
          type="submit"
          className="hq-num px-2 py-1 text-[11px] font-semibold uppercase"
          style={{ background: "var(--hq-accent)", color: "#14100e" }}
        >
          Add
        </button>
      </form>

      <div
        className="flex gap-1 px-2.5 py-1.5"
        style={{ borderBottom: "1px solid var(--hq-line)" }}
      >
        <TabLink
          tab="today"
          active={tab === "today"}
          count={lists.today.length}
        />
        <TabLink
          tab="upcoming"
          active={tab === "upcoming"}
          count={lists.upcoming.length}
        />
        <TabLink tab="done" active={tab === "done"} count={lists.done.length} />
      </div>

      {rows.length === 0 ? (
        <p
          className="px-2.5 py-4 text-[12px]"
          style={{ color: "var(--hq-dim)" }}
        >
          {tab === "today"
            ? 'Nothing due. The quick-add bar above understands a trailing day name — "friday", "tomorrow" — as the due date.'
            : tab === "upcoming"
              ? "Nothing scheduled ahead."
              : "Nothing completed yet."}
        </p>
      ) : (
        <ul>
          {rows.map((task) => (
            <TaskRow key={task.id} task={task} tab={tab} />
          ))}
        </ul>
      )}
    </section>
  );
}

function TabLink({
  tab,
  active,
  count,
}: {
  tab: "today" | "upcoming" | "done";
  active: boolean;
  count: number;
}) {
  return (
    <Link
      href={`/admin/tasks?tab=${tab}`}
      className="hq-label px-2 py-1"
      style={{
        color: active ? "var(--hq-accent)" : "var(--hq-faint)",
        borderBottom: active
          ? "1px solid var(--hq-accent)"
          : "1px solid transparent",
      }}
    >
      {tab} {count > 0 ? `(${count})` : ""}
    </Link>
  );
}

const PRIORITY_COLOUR: Record<HqTask["priority"], string> = {
  high: "var(--hq-down)",
  normal: "var(--hq-faint)",
  low: "var(--hq-faint)",
};

function TaskRow({
  task,
  tab,
}: {
  task: HqTask;
  tab: "today" | "upcoming" | "done";
}) {
  const done = task.status === "done";
  const checked = task.checklist.filter((c) => c.done).length;

  return (
    <li className="hq-row flex items-center gap-2.5 px-2.5 py-1.5">
      <form action={done ? reopenTask : completeTask}>
        <input type="hidden" name="id" value={task.id} />
        <button
          type="submit"
          aria-label={done ? "Reopen task" : "Complete task"}
          className="h-3.5 w-3.5 shrink-0 border"
          style={{
            borderColor: done ? "var(--hq-up)" : "var(--hq-faint)",
            background: done ? "var(--hq-up)" : "transparent",
          }}
        />
      </form>

      <span
        aria-hidden
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: PRIORITY_COLOUR[task.priority] }}
      />

      <span
        className="min-w-0 flex-1 truncate text-[12px]"
        style={{
          color: done ? "var(--hq-faint)" : "var(--hq-text)",
          textDecoration: done ? "line-through" : "none",
        }}
      >
        {task.title}
      </span>

      {task.checklist.length > 0 ? (
        <span
          className="hq-num text-[10px]"
          style={{ color: "var(--hq-faint)" }}
        >
          {checked}/{task.checklist.length}
        </span>
      ) : null}

      {task.link ? <LinkChip link={task.link} /> : null}

      {task.dueDate ? (
        <span
          className="hq-num shrink-0 text-[11px]"
          style={{ color: "var(--hq-dim)" }}
        >
          {new Date(task.dueDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
          })}
        </span>
      ) : null}

      {tab !== "done" ? (
        <form action={snoozeTask} className="flex items-center gap-1">
          <input type="hidden" name="id" value={task.id} />
          <input
            type="date"
            name="snoozedUntil"
            className="hq-num border px-1 py-0.5 text-[10px]"
            aria-label="Snooze until"
          />
          <button
            type="submit"
            className="hq-label px-1"
            style={{ color: "var(--hq-faint)" }}
          >
            snooze
          </button>
        </form>
      ) : null}
    </li>
  );
}

const LINK_HREF: Record<TaskLinkType, (id: string) => string> = {
  order: (id) => `/admin/orders/${id}`,
  supplier: (id) => `/admin/suppliers/${id}`,
  ticket: () => `/admin/inbox`,
  product: () => `/admin/products`,
  customer: (id) => `/admin/customers/${encodeURIComponent(id)}`,
};

function LinkChip({ link }: { link: NonNullable<HqTask["link"]> }) {
  return (
    <Link
      href={toRoute(LINK_HREF[link.type](link.id))}
      className="hq-label shrink-0 border px-1 py-0.5"
      style={{ borderColor: "var(--hq-line)", color: "var(--hq-info)" }}
    >
      {link.type}
    </Link>
  );
}
