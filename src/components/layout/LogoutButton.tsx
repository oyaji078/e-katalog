"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { signOut } from "@/lib/auth-client";

type LogoutButtonProps = {
  className?: string;
  iconOnly?: boolean;
};

export default function LogoutButton({ className = "", iconOnly = false }: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    await signOut({
      fetchOptions: {
        onSuccess() {
          router.push("/login");
          router.refresh();
        },
      },
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className={`disabled:opacity-60 ${className}`}
      title={iconOnly ? "Logout" : undefined}
    >
      {iconOnly ? (
        <LogOut size={20} />
      ) : isLoading ? (
        "Logging out..."
      ) : (
        <>
          <LogOut size={20} />
          Logout
        </>
      )}
    </button>
  );
}
