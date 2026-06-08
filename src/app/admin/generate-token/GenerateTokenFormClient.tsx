'use client';

import { useActionState, useState } from 'react';
import { generateTokenAction, type GenerateTokenState } from './actions';

type EligibleUser = {
  id: string;
  name: string;
  email: string;
  userCode: string;
  whatsappNumber?: string | null;
  storeName?: string | null;
  retailStatus?: string;
};

const initialState: GenerateTokenState = {
  success: false,
  token: '',
  message: '',
  error: '',
};

export default function GenerateTokenFormClient({
  eligibleUsers,
}: {
  eligibleUsers: EligibleUser[];
}) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [copied, setCopied] = useState(false);

  const [state, formAction, isPending] = useActionState(
    generateTokenAction,
    initialState
  );

  const selectedUser = eligibleUsers.find((user) => user.id === selectedUserId);

  return (
    <section className="rounded-xl border border-brand-border bg-white p-6 shadow-sm">
      <form action={formAction} className="space-y-5">
        <div>
          <h2 className="font-semibold text-brand-text">Pilih Pengguna</h2>

          <select
            name="userId"
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(event.target.value)}
            className="mt-3 w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary"
            required
          >
            <option value="">Pilih pengguna...</option>
            {eligibleUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email}) - {user.userCode}
              </option>
            ))}
          </select>
        </div>

        {selectedUser ? (
          <div className="rounded-xl bg-brand-primary/5 p-4 text-sm">
            <h3 className="font-semibold text-brand-primary">
              Detail Pengguna Terpilih
            </h3>

            <div className="mt-2 space-y-1 text-brand-muted">
              <p>
                <span className="font-medium text-brand-text">Nama:</span>{" "}
                {selectedUser.name}
              </p>
              <p>
                <span className="font-medium text-brand-text">Email:</span>{" "}
                {selectedUser.email}
              </p>
              <p>
                <span className="font-medium text-brand-text">WhatsApp:</span>{" "}
                {selectedUser.whatsappNumber || "-"}
              </p>
              <p>
                <span className="font-medium text-brand-text">
                  Toko/Instansi:
                </span>{" "}
                {selectedUser.storeName || "-"}
              </p>
              <p>
                <span className="font-medium text-brand-text">Kode User:</span>{" "}
                {selectedUser.userCode}
              </p>
            </div>
          </div>
        ) : null}

        {state.error ? (
          <div className="rounded-xl border border-brand-accent/20 bg-brand-accent/5 p-4">
            <p className="text-sm font-semibold text-brand-accent">
              {state.error}
            </p>
          </div>
        ) : null}

        {state.success && state.token ? (
          <div className="rounded-xl border border-success/20 bg-success/5 p-4">
            <h3 className="font-semibold text-success">
              OTP Berhasil Dibuat
            </h3>

            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <p className="rounded-lg bg-white p-3 font-mono text-lg font-black tracking-[0.35em] text-success">
                {state.token}
              </p>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(state.token);
                  setCopied(true);
                }}
                className="rounded-lg border border-success/30 px-4 py-2 text-sm font-bold text-success"
              >
                {copied ? "Tersalin" : "Salin"}
              </button>
            </div>

            <p className="mt-2 text-sm text-brand-muted">
              OTP ini hanya ditampilkan sekali dan berlaku 24 jam. Salin lalu kirimkan ke user melalui WhatsApp.
            </p>
          </div>
        ) : null}

        {state.message && !state.error ? (
          <p className="text-sm text-brand-muted">{state.message}</p>
        ) : null}

        <button
          type="submit"
          disabled={isPending || !selectedUserId}
          className="w-full rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {isPending ? "Memproses..." : "Buat OTP Aktivasi"}
        </button>
      </form>
    </section>
  );
}
