import { Providers } from "@/components/providers";
import { SiteChrome } from "@/components/site-chrome";
import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";

const sans = Outfit({ subsets: ["latin"], variable: "--font-sans" });
const display = Fraunces({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Mini India Ireland — Indian groceries delivered fast",
  description: "Your favourite Indian groceries, snacks and essentials delivered across Dublin and Limerick in up to 60 minutes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IE">
      <body className={`${sans.variable} ${display.variable} font-sans antialiased`}>
        <Providers>
          <SiteChrome>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
