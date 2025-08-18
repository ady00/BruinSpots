import type { Metadata } from "next";
import { Inter, Montserrat, Manrope } from "next/font/google";
import "./globals.css";
import { TouchProvider } from "@/components/ui/HybridTooltip";
import { Providers } from "./providers";

const montserrat = Montserrat({ subsets: ["latin"] });
const manrope = Manrope({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "BruinSpots",
    absolute:
      "BruinSpots",
  },
  description:
    "Find available UCLA study spaces and empty classrooms in real-time.",
  icons: {
    icon: [
      {
        url: "/icon-16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/icon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=no"
        />
        <meta name="robots" content="index, follow" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BruinSpots" />
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css"
          crossOrigin="anonymous"
        />
      </head>
        <body className={manrope.className}>
          <Providers>
            <TouchProvider>{children}</TouchProvider>
          </Providers>
        </body>
      
    </html>
  );
}
