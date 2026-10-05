import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Work_Sans } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const workSans = Work_Sans({
  variable: "--font-work",
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
      <body className={`${workSans.variable} ${plexMono.variable} antialiased`}>
        <AuthProvider>
          {children}
          <PwaRegister />
        </AuthProvider>
      </body>
    </html>
  );
}
