import type { Metadata } from "next";
import { MarcaView } from "./marca-view";

export const metadata: Metadata = { title: "Aparência" };

export default function MarcaPage() {
  return <MarcaView />;
}
