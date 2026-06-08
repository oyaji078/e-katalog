"use client";

import { useState } from "react";

import { updateStoreSetting } from "./actions";

type Setting = {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
  description: string | null;
};

export default function StoreSettingsClient({ settings }: { settings: Setting[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((setting) => [setting.key, setting.value])),
  );
  const [saving, setSaving] = useState(false);

  async function handleSave(key: string) {
    setSaving(true);
    await updateStoreSetting(key, values[key] ?? "");
    setSaving(false);
    setEditing(null);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-page)]">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                Key
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                Value
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                Deskripsi
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {settings.map((setting) => (
              <tr
                key={setting.id}
                className="border-b border-[var(--color-border)] transition last:border-0 hover:bg-[var(--color-page)]"
              >
                <td className="px-5 py-3.5 font-mono text-xs text-[var(--color-text)]">{setting.key}</td>
                <td className="px-5 py-3.5">
                  {editing === setting.key ? (
                    <input
                      type={setting.isSecret ? "password" : "text"}
                      value={values[setting.key] ?? ""}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, [setting.key]: event.target.value }))
                      }
                      className="w-full rounded-lg border border-[var(--color-accent)] px-3 py-1.5 text-sm outline-none"
                      autoFocus
                    />
                  ) : (
                    <span className="text-[var(--color-text-muted)]">
                      {setting.isSecret ? "********" : values[setting.key] || "-"}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-xs text-[var(--color-text-muted)]">
                  {setting.description ?? "-"}
                </td>
                <td className="px-5 py-3.5">
                  {editing === setting.key ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSave(setting.key)}
                        disabled={saving}
                        className="rounded-lg bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {saving ? "..." : "Simpan"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(null)}
                        className="rounded-lg border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-muted)]"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditing(setting.key)}
                      className="rounded-lg border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {settings.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-[var(--color-text-muted)]">
                  Belum ada pengaturan. Tambahkan melalui database atau seed script.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
