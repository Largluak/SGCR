import { TOKEN_KEY, USER_KEY } from "./types";

const base = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4311";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = window.localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const resposta = await fetch(`${base}${path}`, { ...init, headers });
  const dados = (await resposta.json().catch(() => null)) as {
    message?: string | string[];
  } | null;

  if (resposta.status === 401 && !path.startsWith("/auth/login")) {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.location.href = "/login";
  }

  if (!resposta.ok) {
    const mensagem = dados?.message;
    throw new ApiError(
      Array.isArray(mensagem)
        ? mensagem.join(" ")
        : mensagem || "Não foi possível concluir a operação.",
      resposta.status,
    );
  }

  return dados as T;
}
