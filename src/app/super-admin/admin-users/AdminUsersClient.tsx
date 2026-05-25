"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { changeUserRole, resetUserPassword, deleteUser, type AdminUserActionResult } from "./actions";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  createdAt: string;
};

const roleInitialState: AdminUserActionResult = { success: false, message: "" };
const passwordInitialState: AdminUserActionResult = { success: false, message: "" };
const deleteInitialState: AdminUserActionResult = { success: false, message: "" };

export default function AdminUsersClient({ users, currentUserId }: { users: AdminUser[]; currentUserId: string }) {
  return (
    <main>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Admin Users</h1>
          <p className="mt-1 text-sm text-brand-muted">
            Manage admin and super admin accounts.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-brand-border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border bg-brand-bg text-left text-xs text-brand-muted">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Password</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  isSelf={u.id === currentUserId}
                  isLastSuperAdmin={users.filter((x) => x.role === "SUPER_ADMIN").length <= 1 && u.role === "SUPER_ADMIN"}
                />
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-brand-muted">
                  No admin users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function UserRow({ user, isSelf, isLastSuperAdmin }: { user: AdminUser; isSelf: boolean; isLastSuperAdmin: boolean }) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <>
      <tr className="border-b border-brand-border/50">
        <td className="px-4 py-3 font-medium text-brand-text">
          {user.name}
          {isSelf ? <span className="ml-2 text-[10px] text-brand-muted">(Anda)</span> : null}
        </td>
        <td className="px-4 py-3 text-brand-muted">{user.email}</td>
        <td className="px-4 py-3">
          <RoleCell user={user} isSelf={isSelf} isLastSuperAdmin={isLastSuperAdmin} />
        </td>
        <td className="px-4 py-3">
          {isSelf ? (
            <span className="text-xs text-brand-muted">—</span>
          ) : (
            <button
              onClick={() => setShowPasswordModal(true)}
              className="rounded-lg border border-brand-border px-3 py-1 text-xs font-semibold text-brand-muted hover:bg-brand-bg"
            >
              Reset
            </button>
          )}
        </td>
        <td className="px-4 py-3 text-brand-muted">
          {new Date(user.createdAt).toLocaleDateString("id-ID")}
        </td>
        <td className="px-4 py-3">
          <DeleteCell user={user} isSelf={isSelf} isLastSuperAdmin={isLastSuperAdmin} />
        </td>
      </tr>

      {showPasswordModal ? (
        <PasswordResetModal
          user={user}
          onClose={() => setShowPasswordModal(false)}
        />
      ) : null}

      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowDeleteConfirm(false)}>
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-brand-text">Hapus User</h3>
            <p className="mt-2 text-sm text-brand-muted">
              Yakin ingin menghapus <span className="font-semibold text-brand-text">{user.name}</span>?
              <br />Tindakan ini tidak dapat dibatalkan.
            </p>
            <DeleteConfirmForm user={user} onDone={() => setShowDeleteConfirm(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}

function RoleCell({ user, isSelf, isLastSuperAdmin }: { user: AdminUser; isSelf: boolean; isLastSuperAdmin: boolean }) {
  const [role, setRole] = useState(user.role);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (isSelf) {
    return <RoleBadge role={user.role} />;
  }

  function handleChange(nextRole: AdminUser["role"]) {
    const previousRole = role;
    setRole(nextRole);
    setError("");
    setMessage("");

    startTransition(async () => {
      const formData = new FormData();
      formData.set("userId", user.id);
      formData.set("role", nextRole);

      const result = await changeUserRole(roleInitialState, formData);
      if (result.success) {
        setRole(nextRole);
        setMessage(result.message || "Role berhasil diubah");
        router.refresh();
        return;
      }

      setRole(previousRole);
      setError(result.error || "Gagal mengubah role. Silakan coba lagi.");
    });
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <select
          name="role"
          value={role}
          disabled={isPending}
          onChange={(e) => handleChange(e.target.value as AdminUser["role"])}
          className="rounded-lg border border-brand-border bg-brand-bg px-2 py-1 text-xs outline-none focus:border-brand-primary disabled:opacity-60"
        >
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
        </select>
        {isPending ? <span className="text-[10px] text-brand-muted">...</span> : null}
      </div>
      {isLastSuperAdmin && role === "SUPER_ADMIN" ? (
        <p className="mt-1 text-[10px] text-brand-muted">Super Admin terakhir tidak dapat diturunkan.</p>
      ) : null}
      {error ? (
        <p className="mt-1 text-[10px] text-danger">{error}</p>
      ) : null}
      {message ? (
        <p className="mt-1 text-[10px] text-success">{message}</p>
      ) : null}
    </div>
  );
}

function DeleteCell({ user, isSelf, isLastSuperAdmin }: { user: AdminUser; isSelf: boolean; isLastSuperAdmin: boolean }) {
  const [state, formAction, isPending] = useActionState(deleteUser, deleteInitialState);
  const [showConfirm, setShowConfirm] = useState(false);

  if (isSelf || isLastSuperAdmin) {
    return <span className="text-xs text-brand-muted">—</span>;
  }

  return (
    <div>
      {showConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowConfirm(false)}>
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-brand-text">Hapus User</h3>
            <p className="mt-2 text-sm text-brand-muted">
              Yakin ingin menghapus <span className="font-semibold text-brand-text">{user.name}</span>?
              <br />Tindakan ini tidak dapat dibatalkan.
            </p>
            {state.error ? (
              <p className="mt-2 text-xs text-danger">{state.error}</p>
            ) : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-xl border border-brand-border px-4 py-2 text-xs font-semibold text-brand-muted hover:bg-brand-bg"
              >
                Batal
              </button>
              <form action={formAction}>
                <input type="hidden" name="userId" value={user.id} />
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-danger px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {isPending ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
      <button
        onClick={() => setShowConfirm(true)}
        className="text-xs font-semibold text-danger hover:text-danger/80"
      >
        Hapus
      </button>
    </div>
  );
}

function DeleteConfirmForm({ user, onDone }: { user: AdminUser; onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(deleteUser, deleteInitialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
      const timer = setTimeout(onDone, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.success, onDone, router]);

  return (
    <div>
      {state.error ? (
        <p className="mt-3 rounded-lg bg-danger/5 p-3 text-xs text-danger">{state.error}</p>
      ) : null}
      {state.success ? (
        <div className="mt-3 rounded-lg bg-success/5 p-3 text-center text-xs text-success">
          {state.message}
        </div>
      ) : (
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onDone}
            className="rounded-xl border border-brand-border px-4 py-2 text-xs font-semibold text-brand-muted hover:bg-brand-bg"
          >
            Batal
          </button>
          <form action={formAction}>
            <input type="hidden" name="userId" value={user.id} />
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-danger px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {isPending ? "Menghapus..." : "Ya, Hapus"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function PasswordResetModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(resetUserPassword, passwordInitialState);
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.success, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-bold text-brand-text">Reset Password</h3>
        <p className="mt-1 text-sm text-brand-muted">
          Reset password untuk <span className="font-semibold text-brand-text">{user.name}</span>
        </p>

        {state.error ? (
          <p className="mt-3 rounded-lg bg-danger/5 p-3 text-xs text-danger">{state.error}</p>
        ) : null}

        {state.success ? (
          <div className="mt-3 rounded-lg bg-success/5 p-3 text-center text-xs text-success">
            {state.message}
          </div>
        ) : (
          <form action={formAction} className="mt-4 space-y-3">
            <input type="hidden" name="userId" value={user.id} />

            <div>
              <label className="block text-xs font-semibold text-brand-text">Password Baru</label>
              <input
                name="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                maxLength={128}
                placeholder="Minimal 8 karakter"
                className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2 text-sm outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text">
                Password Anda Saat Ini
              </label>
              <input
                name="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="Konfirmasi identitas Anda"
                className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2 text-sm outline-none focus:border-brand-primary"
              />
              <p className="mt-1 text-[10px] text-brand-muted">
                Masukkan password Anda sendiri untuk memverifikasi identitas
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-brand-border px-4 py-2 text-xs font-semibold text-brand-muted hover:bg-brand-bg"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                {isPending ? "Menyimpan..." : "Simpan Password Baru"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const isSuper = role === "SUPER_ADMIN";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
        isSuper ? "bg-brand-accent/20 text-brand-accent" : "bg-brand-secondary/15 text-brand-primary"
      }`}
    >
      {role}
    </span>
  );
}
