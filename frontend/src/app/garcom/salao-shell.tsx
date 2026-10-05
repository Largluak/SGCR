"use client";

import { RequireAuth } from "@/components/auth-provider";

export function SalaoShell({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-[#1c232b] text-[#ede9df]">{children}</div>
    </RequireAuth>
  );
}
