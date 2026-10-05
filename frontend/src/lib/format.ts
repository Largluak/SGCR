import type { Categoria, FormaPagamento, StatusMesa } from "./types";

export function reais(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function haQuantoTempo(iso: string, agora = new Date()) {
  const minutos = Math.max(
    0,
    Math.round((agora.getTime() - new Date(iso).getTime()) / 60000),
  );
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas < 24) {
    return resto ? `${horas}h${String(resto).padStart(2, "0")}` : `${horas}h`;
  }
  const dias = Math.floor(horas / 24);
  return dias === 1 ? "1 dia" : `${dias} dias`;
}

export function turno(agora = new Date()) {
  const hora = agora.getHours();
  if (hora < 12) return "manhã";
  if (hora < 18) return "tarde";
  return "noite";
}

export function dataPorExtenso(agora = new Date()) {
  const texto = agora.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function numeroMesa(numero: number) {
  return String(numero).padStart(2, "0");
}

export function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

export function porPessoa(total: number, pessoas: number) {
  if (pessoas < 1) return total;
  return Math.round((total * 100) / pessoas) / 100;
}

export const categoriaLabel: Record<Categoria, string> = {
  ENTRADA: "Entradas",
  PRATO: "Pratos",
  BEBIDA: "Bebidas",
  SOBREMESA: "Sobremesas",
};

export const tipoLabel = {
  DIRETO: "Direto",
  PREPARADO: "Preparado",
} as const;

export const statusMesaLabel: Record<StatusMesa, string> = {
  LIVRE: "Livre",
  OCUPADA: "Ocupada",
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
};

export const formaLabel: Record<FormaPagamento, string> = {
  DINHEIRO: "Dinheiro",
  CARTAO: "Cartão",
  PIX: "Pix",
};

export const categorias: Categoria[] = ["ENTRADA", "PRATO", "BEBIDA", "SOBREMESA"];
