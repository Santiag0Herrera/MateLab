import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { ThemeToggle } from "../components/ThemeToggle";
import { AuthGuard } from "../components/AuthGuard";
import "../styles/index.css";

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "MateLab",
  description: "Practica matematica con correcciones asistidas por IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={jetBrainsMono.variable}>
        <ThemeToggle />
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
