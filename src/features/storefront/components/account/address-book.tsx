"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Address } from "@/server/actions/addresses";
import { deleteAddress, saveAddress } from "@/server/actions/addresses";

export function AddressBook({ addresses }: { addresses: Address[] }) {
  const [editing, setEditing] = React.useState<Address | null>(null);
  const [adding, setAdding] = React.useState(false);

  if (editing || adding) {
    return (
      <AddressForm
        address={editing}
        onDone={() => {
          setEditing(null);
          setAdding(false);
        }}
      />
    );
  }

  return (
    <div>
      {addresses.length === 0 ? (
        <p className="text-muted text-[15px]">No saved addresses yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {addresses.map((address) => (
            <li key={address.id} className="border-line rounded-xl border p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-ink text-lg">
                    {address.label}
                    {address.isDefault ? (
                      <span className="text-brass ml-2 text-[11px] font-medium tracking-[0.1em] uppercase">
                        Default
                      </span>
                    ) : null}
                  </p>
                  <p className="text-ink/80 mt-2 text-[14px] leading-relaxed">
                    {address.fullName}
                    <br />
                    {address.addressLine1}
                    {address.addressLine2 ? (
                      <>
                        <br />
                        {address.addressLine2}
                      </>
                    ) : null}
                    <br />
                    {address.city}
                    {address.region ? `, ${address.region}` : ""}{" "}
                    {address.postcode}
                    <br />
                    {address.country}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2 text-[13px]">
                  <button
                    type="button"
                    onClick={() => setEditing(address)}
                    className="text-ink hover:text-brass transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAddress(address.id)}
                    className="text-muted transition-colors hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="secondary"
        onClick={() => setAdding(true)}
        className="mt-6"
      >
        + Add new address
      </Button>
    </div>
  );
}

function AddressForm({
  address,
  onDone,
}: {
  address: Address | null;
  onDone: () => void;
}) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await saveAddress(new FormData(event.currentTarget));
      if (!result.ok) {
        setError(result.error ?? "Something went wrong. Please try again.");
        return;
      }
      onDone();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4">
      {address ? <input type="hidden" name="id" value={address.id} /> : null}

      <label className="flex flex-col gap-1.5">
        <span className="text-muted text-[12px] font-medium tracking-[0.08em] uppercase">
          Label
        </span>
        <Input
          type="text"
          name="label"
          defaultValue={address?.label ?? "Home"}
          placeholder="Home"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-muted text-[12px] font-medium tracking-[0.08em] uppercase">
          Full name
        </span>
        <Input
          type="text"
          name="fullName"
          required
          defaultValue={address?.fullName}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-muted text-[12px] font-medium tracking-[0.08em] uppercase">
          Address line 1
        </span>
        <Input
          type="text"
          name="addressLine1"
          required
          defaultValue={address?.addressLine1}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-muted text-[12px] font-medium tracking-[0.08em] uppercase">
          Address line 2
        </span>
        <Input
          type="text"
          name="addressLine2"
          defaultValue={address?.addressLine2 ?? ""}
        />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-muted text-[12px] font-medium tracking-[0.08em] uppercase">
            City
          </span>
          <Input
            type="text"
            name="city"
            required
            defaultValue={address?.city}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-muted text-[12px] font-medium tracking-[0.08em] uppercase">
            County / Region
          </span>
          <Input
            type="text"
            name="region"
            defaultValue={address?.region ?? ""}
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-muted text-[12px] font-medium tracking-[0.08em] uppercase">
            Postcode
          </span>
          <Input
            type="text"
            name="postcode"
            required
            defaultValue={address?.postcode}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-muted text-[12px] font-medium tracking-[0.08em] uppercase">
            Country
          </span>
          <Input
            type="text"
            name="country"
            defaultValue={address?.country ?? "GB"}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-muted text-[12px] font-medium tracking-[0.08em] uppercase">
          Phone
        </span>
        <Input type="tel" name="phone" defaultValue={address?.phone ?? ""} />
      </label>
      <label className="flex items-center gap-2 text-[14px]">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={address?.isDefault}
        />
        Set as default address
      </label>

      <div className="mt-2 flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save address"}
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>

      {error ? (
        <p className="text-[13px] text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
