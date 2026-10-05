import type { Metadata } from "next";
import { ComandaView } from "./comanda-view";

export const metadata: Metadata = { title: "Comanda" };

export default function ComandaPage() {
  return <ComandaView />;
}
