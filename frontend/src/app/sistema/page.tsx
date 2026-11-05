import type { Metadata } from "next";
import { SistemaView } from "./sistema-view";

export const metadata: Metadata = { title: "Sistema" };

export default function SistemaPage() {
  return <SistemaView />;
}
