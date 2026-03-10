import type { Metadata } from "next";
import { AuthProvider } from "../lib/auth-context";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Arquitecto Financiero",
  description: "Descubre la verdad detrás de tus créditos. Simuladores gratuitos de hipoteca, auto, Infonavit, tarjeta de crédito e interés compuesto.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@400;600;700;800&family=Space+Grotesk:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0B1120" />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-07S3M6XSXB" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-07S3M6XSXB');
          `}
        </Script>
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

**Ctrl + S**. Después en la terminal:
```
git add .
```
```
git commit -m "Google Analytics activado"
```
```
git push