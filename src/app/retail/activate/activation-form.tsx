"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { activateRetailToken } from "./actions";

export default function ActivationForm() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState("");
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

     try {
       const state = await activateRetailToken({ status: "idle" }, formData);

      if (state.status === "success") {
        // Redirect to success page on successful activation
        router.push("/retail/activate/success");
      } else {
        // Set error message if activation failed
        setError(state.message ?? "Activation failed. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-semibold" htmlFor="token">
          Retail Activation Token
        </label>
        <input
          id="token"
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter your activation token"
          required
          className="mt-2 w-full rounded-xl border border-border-gray px-3 py-3 text-sm outline-none focus:border-primary-maroon"
        />
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-primary-maroon px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {isSubmitting ? "Memverifikasi..." : "Activate Retail"}
      </button>
    </form>
  );
}