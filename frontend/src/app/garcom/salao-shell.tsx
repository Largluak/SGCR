"use client";

import { RequireAuth } from "@/components/auth-provider";

export function SalaoShell({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-salao text-salao-ink">{children}</div>
    </RequireAuth>
  );
}
