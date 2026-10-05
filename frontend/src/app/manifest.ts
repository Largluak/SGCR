import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SGCR — Sistema de Gestão de Comandas",
    short_name: "SGCR",
    description:
      "Comandas digitais, estoque de bebidas e relatórios para restaurantes de pequeno porte.",
    start_url: "/",
    display: "standalone",
    background_color: "#EDEAE2",
    theme_color: "#EDEAE2",
    lang: "pt-BR",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
