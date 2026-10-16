export type Perfil = "GARCOM" | "GERENTE";

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
};

export type StatusMesa = "LIVRE" | "OCUPADA" | "AGUARDANDO_PAGAMENTO";

export type Mesa = {
  id: string;
  numero: number;
  status: StatusMesa;
  comanda: null | {
    id: string;
    pessoas: number;
    abertaEm: string;
    aguardandoPagamento: boolean;
    total: number;
    totalPendente: number;
  };
};

export type Categoria = "ENTRADA" | "PRATO" | "BEBIDA" | "SOBREMESA";
export type TipoProduto = "DIRETO" | "PREPARADO";
export type FormaPagamento = "DINHEIRO" | "CARTAO" | "PIX";

export type ItemComanda = {
  id: string;
  quantidade: number;
  precoUnitario: number;
  total: number;
  statusPagamento: "PENDENTE" | "PAGO";
  produto: {
    id: string;
    nome: string;
    categoria: Categoria;
    tipo: TipoProduto;
  };
};

export type Comanda = {
  id: string;
  status: "ABERTA" | "FECHADA";
  pessoas: number;
  aguardandoPagamento: boolean;
  abertaEm: string;
  fechadaEm: string | null;
  mesa: { id: string; numero: number };
  total: number;
  totalPago: number;
  totalPendente: number;
  itens: ItemComanda[];
  pagamentos: {
    id: string;
    forma: FormaPagamento;
    valor: number;
    criadoEm: string;
    itemIds: string[];
  }[];
};

export type Produto = {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: Categoria;
  preco: number;
  tipo: TipoProduto;
  ativo: boolean;
  estoque: { quantidade: number; minimo: number } | null;
};

export type EstoqueItem = {
  produtoId: string;
  nome: string;
  categoria: Categoria;
  quantidade: number;
  minimo: number;
  baixo: boolean;
};

export type Dashboard = {
  vendasDoDia: number;
  comandasDoDia: number;
  mesasOcupadas: number;
  totalMesas: number;
  estoqueBaixo: {
    produtoId: string;
    nome: string;
    quantidade: number;
    minimo: number;
  }[];
  ultimasComandas: {
    id: string;
    mesaNumero: number;
    abertaEm: string;
    pessoas: number;
    status: "ABERTA" | "FECHADA";
    statusOperacional: "EM_ANDAMENTO" | "AGUARDANDO_PAGAMENTO" | "FECHADA";
    total: number;
  }[];
};

export type Relatorio = {
  periodo: "mensal" | "trimestral" | "semestral";
  rotulo: string;
  totalVendido: number;
  comandasFechadas: number;
  produtoMaisVendido: { nome: string; quantidade: number; total: number } | null;
  mediaMensal: number;
  melhorMes: { rotulo: string; total: number } | null;
  vendasPorMes: { rotulo: string; total: number }[];
  ranking: { nome: string; quantidade: number; total: number }[];
};

export type Marca = {
  nome: string;
  corSecundaria: string;
  fotoUrl: string | null;
  atualizadoEm: string;
};

export const MARCA_PADRAO: Marca = {
  nome: "Ardósia",
  corSecundaria: "#B08968",
  fotoUrl: null,
  atualizadoEm: "",
};

export const TOKEN_KEY = "sgcr_token";
export const USER_KEY = "sgcr_usuario";
