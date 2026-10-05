import type { Metadata } from "next";
import { FechamentoView } from "./fechamento-view";

export const metadata: Metadata = { title: "Fechamento" };

export default function FechamentoPage() {
  return <FechamentoView />;
}
