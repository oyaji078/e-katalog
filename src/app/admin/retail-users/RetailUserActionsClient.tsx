"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import {
  approveRetailUserAction,
  rejectRetailUserAction,
  type RetailUserActionState,
} from "./actions";

type RetailUserActionsClientProps = {
  userId: string;
  status: string;
  applicantName: string;
  whatsappNumber?: string | null;
  activationToken?: string | null;
  whatsappUrl?: string;
  whatsappMessage?: string;
};

const initialRetailActionState: RetailUserActionState = {
  success: false,
  message: "",
  error: "",
};

export default function RetailUserActionsClient({
  userId,
  status,
  activationToken,
  whatsappUrl,
  whatsappMessage,
}: RetailUserActionsClientProps) {
  const router = useRouter();
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);
  const [copiedMessage, setCopiedMessage] = useState("");
  const [approveState, approveFormAction, isApproving] = useActionState(
    approveRetailUserAction,
    initialRetailActionState,
  );
  const [rejectState, rejectFormAction, isRejecting] = useActionState(
    rejectRetailUserAction,
    initialRetailActionState,
  );

  const effectiveToken = approveState.token || activationToken || "";
  const effectiveWaUrl = approveState.waUrl || whatsappUrl;
  const effectiveWhatsappMessage = approveState.whatsappMessage || whatsappMessage;

  useEffect(() => {
    if ((approveState.success && approveState.token) || rejectState.success) {
      router.refresh();
    }
  }, [approveState.success, approveState.token, rejectState.success, router]);

  async function copyToken(token: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(token);
        setCopiedMessage("Kode berhasil disalin.");
        return;
      }
    } catch {
      // Fall through to the textarea copy fallback for browsers that block clipboard permissions.
    }

    const textarea = document.createElement("textarea");
    textarea.value = token;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    setCopiedMessage(copied ? "Kode berhasil disalin." : "Gagal menyalin kode.");
  }

  if (status === "PENDING_RETAIL" && effectiveToken) {
    return (
      <div className="min-w-0 space-y-2">
        <div className="rounded-lg border border-brand-primary/15 bg-brand-primary/5 p-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand-muted">
            Kode Aktivasi
          </p>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
            <code className="rounded bg-white px-2 py-1 font-mono text-sm font-black tracking-[0.25em] text-brand-primary">
              {effectiveToken}
            </code>
            <button
              type="button"
              onClick={() => copyToken(effectiveToken)}
              className="rounded border border-brand-primary/30 px-2 py-1 text-xs font-bold text-brand-primary hover:bg-brand-primary hover:text-white"
            >
              Copy Kode
            </button>
          </div>
          {copiedMessage ? (
            <p className="mt-1 text-xs font-semibold text-success">{copiedMessage}</p>
          ) : null}
        </div>

        {approveState.success ? (
          <p className="text-xs font-semibold text-success">{approveState.message}</p>
        ) : null}
        {approveState.error ? (
          <p className="text-xs font-semibold text-danger">{approveState.error}</p>
        ) : null}

        {effectiveWaUrl ? (
          <a
            href={effectiveWaUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center rounded-lg bg-whatsapp-green px-3 py-2 text-xs font-bold text-white hover:bg-whatsapp-green/90"
          >
            Kirim WhatsApp
          </a>
        ) : (
          <p className="text-xs text-brand-muted">Nomor WhatsApp belum tersedia.</p>
        )}

        {effectiveWhatsappMessage ? (
          <textarea
            readOnly
            value={effectiveWhatsappMessage}
            className="h-20 w-full resize-none rounded-lg border border-brand-border bg-white p-2 text-xs text-brand-muted"
          />
        ) : null}
      </div>
    );
  }

  if (status !== "PENDING_RETAIL") {
    if (status === "REGISTERED") {
      return <span className="text-xs text-brand-muted">Registrasi ritel belum lengkap</span>;
    }

    return <span className="text-xs text-brand-muted">-</span>;
  }

  if (rejectState.success) {
    return (
      <p className="rounded-lg border border-success/20 bg-success/5 p-2 text-xs font-semibold text-success">
        {rejectState.message}
      </p>
    );
  }

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setConfirmAction("approve")}
          className="rounded-lg bg-success px-3 py-1.5 text-xs font-bold text-white"
        >
          Setujui
        </button>
        <button
          type="button"
          onClick={() => setConfirmAction("reject")}
          className="rounded-lg border border-danger px-3 py-1.5 text-xs font-bold text-danger"
        >
          Tolak
        </button>
      </div>

      {approveState.error ? (
        <p className="text-xs font-semibold text-danger">{approveState.error}</p>
      ) : null}
      {rejectState.error ? (
        <p className="text-xs font-semibold text-danger">{rejectState.error}</p>
      ) : null}
      {confirmAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-black text-brand-text">
              {confirmAction === "approve" ? "Setujui Pendaftar Ritel?" : "Tolak Pendaftar Ritel?"}
            </h2>
            <p className="mt-2 text-sm text-brand-muted">
              {confirmAction === "approve"
                ? "Jika disetujui, sistem akan membuat kode aktivasi ritel 6 digit secara otomatis."
                : "Pendaftar akan ditandai sebagai ditolak."}
            </p>
            <form
              action={confirmAction === "approve" ? approveFormAction : rejectFormAction}
              onSubmit={() => setConfirmAction(null)}
              className="mt-5 flex justify-end gap-2"
            >
              <input type="hidden" name="userId" value={userId} />
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="rounded-xl border border-brand-border px-4 py-2 text-sm font-bold text-brand-muted"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isApproving || isRejecting}
                className={
                  confirmAction === "approve"
                    ? "rounded-xl bg-success px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                    : "rounded-xl bg-danger px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                }
              >
                {confirmAction === "approve" ? "Ya, Setujui" : "Ya, Tolak"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
