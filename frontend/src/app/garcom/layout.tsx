import type { Metadata } from "next";
import { SalaoShell } from "./salao-shell";

export const metadata: Metadata = { title: "Salão" };

export default function GarcomLayout({ children }: { children: React.ReactNode }) {
  return <SalaoShell>{children}</SalaoShell>;
}
