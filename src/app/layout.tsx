import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { LanguageProvider } from "@/components/ui/language-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Horaria - IA para horarios escolares",
    template: "%s | Horaria"
  },
  description: "Plataforma inteligente para generar horarios escolares sin conflictos.",
  applicationName: "Horaria",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "512x512" }
    ],
    shortcut: "/favicon.png",
    apple: "/favicon.png"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
