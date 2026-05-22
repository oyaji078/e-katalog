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

  const [state, formAction, isPending] = useActionState(
    generateTokenAction,
    initialState
  );

  const selectedUser = eligibleUsers.find((user) => user.id === selectedUserId);

  return (
    <section className="rounded-xl border border-border-gray bg-white p-6 shadow-sm">
      <form action={formAction} className="space-y-5">
        <div>
          <h2 className="font-semibold text-text-dark">Pilih Pengguna</h2>

          <select
            name="userId"
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(event.target.value)}
            className="mt-3 w-full rounded-xl border border-border-gray px-4 py-3 text-sm outline-none focus:border-primary-maroon"
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
          <div className="rounded-xl bg-primary-maroon/5 p-4 text-sm">
            <h3 className="font-semibold text-primary-maroon">
              Detail Pengguna Terpilih
            </h3>

            <div className="mt-2 space-y-1 text-text-muted">
              <p>
                <span className="font-medium text-text-dark">Nama:</span>{" "}
                {selectedUser.name}
              </p>
              <p>
                <span className="font-medium text-text-dark">Email:</span>{" "}
                {selectedUser.email}
              </p>
              <p>
                <span className="font-medium text-text-dark">WhatsApp:</span>{" "}
                {selectedUser.whatsappNumber || "-"}
              </p>
              <p>
                <span className="font-medium text-text-dark">
                  Toko/Instansi:
                </span>{" "}
                {selectedUser.storeName || "-"}
              </p>
              <p>
                <span className="font-medium text-text-dark">Kode User:</span>{" "}
                {selectedUser.userCode}
              </p>
            </div>
          </div>
        ) : null}

        {state.error ? (
          <div className="rounded-xl border border-accent-rose/20 bg-accent-rose/5 p-4">
            <p className="text-sm font-semibold text-accent-rose">
              {state.error}
            </p>
          </div>
        ) : null}

        {state.success && state.token ? (
          <div className="rounded-xl border border-success/20 bg-success/5 p-4">
            <h3 className="font-semibold text-success">
              Token Berhasil Dibuat
            </h3>

            <p className="mt-2 rounded-lg bg-white p-3 font-mono text-sm text-success">
              {state.token}
            </p>

            <p className="mt-2 text-sm text-text-muted">
              Token ini hanya ditampilkan sekali. Salin dan kirimkan ke user
              melalui WhatsApp.
            </p>
          </div>
        ) : null}

        {state.message && !state.error ? (
          <p className="text-sm text-text-muted">{state.message}</p>
        ) : null}

        <button
          type="submit"
          disabled={isPending || !selectedUserId}
          className="w-full rounded-xl bg-primary-maroon px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {isPending ? "Memproses..." : "Buat Token Aktivasi"}
        </button>
      </form>
    </section>
  );
}