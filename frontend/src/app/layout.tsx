import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { MarcaProvider } from "@/components/marca-provider";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const texto = Source_Sans_3({
  variable: "--font-text",
  subsets: ["latin"],
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "SGCR — Comandas",
    template: "%s | SGCR",
  },
  description:
    "Sistema de gestão de comandas para restaurantes de pequeno porte: salão, estoque de bebidas e relatórios.",
  applicationName: "SGCR",
  appleWebApp: {
    capable: true,
    title: "SGCR",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#EDEAE2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${texto.variable} ${display.variable} ${plexMono.variable} antialiased`}>
        <MarcaProvider>
          <AuthProvider>
            {children}
            <PwaRegister />
          </AuthProvider>
        </MarcaProvider>
      </body>
    </html>
  );
}
