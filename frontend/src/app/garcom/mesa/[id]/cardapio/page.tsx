import type { Metadata } from "next";
import { CardapioView } from "./cardapio-view";

export const metadata: Metadata = { title: "Cardápio" };

export default function CardapioPage() {
  return <CardapioView />;
}
