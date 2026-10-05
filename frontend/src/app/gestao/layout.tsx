import type { Metadata } from "next";
import { Painel } from "./painel";

export const metadata: Metadata = { title: "Painel de gestão" };

export default function GestaoLayout({ children }: { children: React.ReactNode }) {
  return <Painel>{children}</Painel>;
}
