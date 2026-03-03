import type { Metadata } from "next";
import { AuthProvider } from "../lib/auth-context";

export const metadata: Metadata = {
  title: "Arquitecto Financiero",
  description: "Toma el control de tu dinero",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#0B1120" }}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}