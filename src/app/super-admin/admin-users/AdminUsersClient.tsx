"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { changeUserRole, resetUserPassword, deleteUser, createAdminUser, type AdminUserActionResult } from "./actions";

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
const createInitialState: AdminUserActionResult = { success: false, message: "" };

export default function AdminUsersClient({ users, currentUserId }: { users: AdminUser[]; currentUserId: string }) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <main>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Admin Users</h1>
          <p className="mt-1 text-sm text-brand-muted">
            Manage admin and super admin accounts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center rounded-lg bg-brand-accent px-4 py-2 text-sm font-bold text-brand-on-accent transition hover:bg-brand-accent-hover"
        >
          Tambah User
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-brand-border bg-white shadow-sm">
        <table className="min-w-[760px] w-full text-sm">
          <thead>
            <tr className="border-b border-[#D7DEE8] bg-[#EEF4F7] text-left text-xs text-[#111827]">
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
      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
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
    const currentPassword = window.prompt("Masukkan password Anda saat ini untuk mengubah role.");
    if (!currentPassword) {
      setRole(previousRole);
      return;
    }

    setRole(nextRole);
    setError("");
    setMessage("");

    startTransition(async () => {
      const formData = new FormData();
      formData.set("userId", user.id);
      formData.set("role", nextRole);
      formData.set("currentPassword", currentPassword);

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
            <form action={formAction} className="mt-4">
              <input type="hidden" name="userId" value={user.id} />
              <label className="block text-xs font-semibold text-brand-text">
                Password Anda Saat Ini
                <input
                  name="currentPassword"
                  type="password"
                  required
                  className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-3 py-2 text-sm outline-none focus:border-brand-primary"
                />
              </label>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="rounded-xl border border-brand-border px-4 py-2 text-xs font-semibold text-brand-muted hover:bg-brand-bg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-danger px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {isPending ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </form>
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
        <form action={formAction} className="mt-4">
          <input type="hidden" name="userId" value={user.id} />
          <label className="block text-xs font-semibold text-brand-text">
              Password Anda Saat Ini
            <input
              name="currentPassword"
              type="password"
              required
              className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-3 py-2 text-sm outline-none focus:border-brand-primary"
            />
          </label>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onDone}
              className="rounded-xl border border-brand-border px-4 py-2 text-xs font-semibold text-brand-muted hover:bg-brand-bg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-danger px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {isPending ? "Menghapus..." : "Ya, Hapus"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function CreateUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createAdminUser, createInitialState);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminUser["role"]>("ADMIN");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  // Reset the form fields synchronously during render (rather than in an
  // effect) exactly once per new action-state object, matching React's
  // "adjusting state when a prop changes" pattern — avoids the extra
  // post-paint render a setState-in-effect would trigger.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.success) {
      setName("");
      setEmail("");
      setRole("ADMIN");
      setPassword("");
      setCurrentPassword("");
    }
  }

  useEffect(() => {
    if (state.success) {
      router.refresh();
      const timer = setTimeout(onClose, 1200);
      return () => clearTimeout(timer);
    }
  }, [state.success, onClose, router]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-brand-text">Tambah Admin User</h3>
            <p className="mt-1 text-sm text-brand-muted">Buat akun admin baru dengan role dan password.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand-border p-2 text-brand-muted transition hover:bg-brand-bg"
          >
            ×
          </button>
        </div>

        {state.error ? (
          <p className="mt-4 rounded-lg bg-danger/5 p-3 text-xs text-danger">{state.error}</p>
        ) : null}

        {state.success ? (
          <div className="mt-4 rounded-lg bg-success/5 p-3 text-sm text-success">
            {state.message}
          </div>
        ) : null}

        <form action={formAction} className="mt-4 grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-brand-text">
              Nama lengkap
              <input
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-3 py-2 text-sm outline-none focus:border-brand-primary"
              />
            </label>
            <label className="block text-xs font-semibold text-brand-text">
              Email
              <input
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-3 py-2 text-sm outline-none focus:border-brand-primary"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-brand-text">
              Role
              <select
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value as AdminUser["role"])}
                className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-3 py-2 text-sm outline-none focus:border-brand-primary"
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              </select>
            </label>
            <label className="block text-xs font-semibold text-brand-text">
              Password baru
              <input
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-3 py-2 text-sm outline-none focus:border-brand-primary"
              />
            </label>
          </div>

          <label className="block text-xs font-semibold text-brand-text">
            Password Anda Saat Ini
            <input
              name="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-3 py-2 text-sm outline-none focus:border-brand-primary"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
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
              className="rounded-xl bg-brand-accent px-4 py-2 text-xs font-bold text-brand-on-accent disabled:opacity-60"
            >
              {isPending ? "Menyimpan..." : "Tambah User"}
            </button>
          </div>
        </form>
      </div>
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
