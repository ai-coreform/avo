import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans, Figtree } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
import { ReactQueryProvider } from "@/lib/react-query-provider";
import { cn } from "@/lib/utils";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://avomenu.com"),
  title: {
    template: "Avo - %s",
    default: "Avo | Menu digitale per ristoranti",
  },
  description:
    "Avo aiuta i ristoranti a pubblicare un menu digitale con QR code, traduzioni e gestione semplice dal back office.",
  applicationName: "Avo",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: "Avo",
    title: "Avo | Menu digitale per ristoranti",
    description:
      "Menu digitale con QR code, traduzioni automatiche e back office semplice per ristoranti.",
    images: [
      {
        url: "/images/header-image.png",
        width: 2000,
        height: 1125,
        alt: "Anteprima del menu digitale Avo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Avo | Menu digitale per ristoranti",
    description:
      "Menu digitale con QR code, traduzioni automatiche e back office semplice per ristoranti.",
    images: ["/images/header-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={cn("font-sans", figtree.variable)} lang="it">
      <body className={`${bricolage.variable} ${dmSans.variable} antialiased`}>
        <ReactQueryProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
