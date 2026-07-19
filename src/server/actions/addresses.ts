"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export interface Address {
  id: string;
  label: string;
  fullName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string | null;
  postcode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
}

interface AddressRow {
  id: string;
  label: string;
  full_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  region: string | null;
  postcode: string;
  country: string;
  phone: string | null;
  is_default: boolean;
}

function rowToAddress(row: AddressRow): Address {
  return {
    id: row.id,
    label: row.label,
    fullName: row.full_name,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    region: row.region,
    postcode: row.postcode,
    country: row.country,
    phone: row.phone,
    isDefault: row.is_default,
  };
}

export async function listAddresses(): Promise<Address[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as AddressRow[]).map(rowToAddress);
}

export interface SaveAddressResult {
  ok: boolean;
  error?: string;
}

export async function saveAddress(
  formData: FormData,
): Promise<SaveAddressResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in." };

  const id = formData.get("id");
  const label = formData.get("label");
  const fullName = formData.get("fullName");
  const addressLine1 = formData.get("addressLine1");
  const addressLine2 = formData.get("addressLine2");
  const city = formData.get("city");
  const region = formData.get("region");
  const postcode = formData.get("postcode");
  const country = formData.get("country");
  const phone = formData.get("phone");
  const isDefault = formData.get("isDefault") === "on";

  if (
    typeof fullName !== "string" ||
    !fullName.trim() ||
    typeof addressLine1 !== "string" ||
    !addressLine1.trim() ||
    typeof city !== "string" ||
    !city.trim() ||
    typeof postcode !== "string" ||
    !postcode.trim()
  ) {
    return { ok: false, error: "Please fill in the required fields." };
  }

  const row = {
    user_id: user.id,
    label: typeof label === "string" && label.trim() ? label.trim() : "Home",
    full_name: fullName.trim(),
    address_line1: addressLine1.trim(),
    address_line2:
      typeof addressLine2 === "string" && addressLine2.trim()
        ? addressLine2.trim()
        : null,
    city: city.trim(),
    region: typeof region === "string" && region.trim() ? region.trim() : null,
    postcode: postcode.trim(),
    country:
      typeof country === "string" && country.trim() ? country.trim() : "GB",
    phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
    is_default: isDefault,
  };

  if (isDefault) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);
  }

  const { error } =
    typeof id === "string" && id
      ? await supabase
          .from("addresses")
          .update(row)
          .eq("id", id)
          .eq("user_id", user.id)
      : await supabase.from("addresses").insert(row);

  if (error) {
    console.error("saveAddress: failed", error.message);
    return { ok: false, error: "Something went wrong saving that address." };
  }
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function deleteAddress(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("addresses").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/account/addresses");
}
