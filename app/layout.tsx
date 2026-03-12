import type { Metadata } from "next";
import { AuthProvider } from "../lib/auth-context";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Arquitecto Financiero | Simulador de Crédito Hipotecario, Auto, Infonavit y Tarjeta",
  description: "Calculadora gratuita de hipoteca, crédito automotriz, Infonavit, tarjeta de crédito e interés compuesto. Descubre cuánto pagarás realmente por tu casa, carro o deuda. Simula abonos a capital y ahorra miles de pesos.",
  keywords: "simulador hipoteca, calculadora crédito, Infonavit, simulador tarjeta de crédito, pago mínimo, interés compuesto, calculadora ahorro, simulador crédito automotriz, abonos a capital, finanzas personales México, calculadora hipotecaria, simulador de deuda",
  authors: [{ name: "Arquitecto Financiero" }],
  openGraph: {
    title: "Arquitecto Financiero | ¿Cuánto pagarás realmente por tu crédito?",
    description: "Simuladores gratuitos de hipoteca, auto, Infonavit, tarjeta de crédito e interés compuesto. Descubre la verdad detrás de tus deudas.",
    url: "https://arquitecto-financiero.vercel.app",
    siteName: "Arquitecto Financiero",
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arquitecto Financiero | ¿Cuánto pagarás realmente por tu crédito?",
    description: "Simuladores gratuitos de hipoteca, auto, Infonavit, tarjeta de crédito e interés compuesto.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "https://arquitecto-financiero.vercel.app",
  },
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
        <link rel="canonical" href="https://arquitecto-financiero.vercel.app" />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-07S3M6XSXB" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-07S3M6XSXB');
          `}
        </Script>
        <Script id="structured-data" type="application/ld+json" strategy="afterInteractive">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Arquitecto Financiero",
              "description": "Simuladores gratuitos de crédito hipotecario, automotriz, Infonavit, tarjeta de crédito e interés compuesto para México",
              "url": "https://arquitecto-financiero.vercel.app",
              "applicationCategory": "FinanceApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "MXN"
              },
              "inLanguage": "es-MX",
              "audience": {
                "@type": "Audience",
                "audienceType": "Personas con créditos hipotecarios, automotrices, tarjetas de crédito o interés en ahorro e inversión"
              }
            }
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
