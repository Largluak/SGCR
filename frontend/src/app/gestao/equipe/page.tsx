import type { Metadata } from "next";
import { EquipeView } from "./equipe-view";

export const metadata: Metadata = { title: "Equipe" };

export default function EquipePage() {
  return <EquipeView />;
}
