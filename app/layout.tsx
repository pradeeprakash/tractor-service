import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Tamil } from "next/font/google";
import { cookies } from "next/headers";
import { Providers } from "./providers";
import type { Locale } from "@/lib/i18n/useT";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoTamil = Noto_Sans_Tamil({
  subsets: ["tamil", "latin"],
  variable: "--font-tamil",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Prakash Tractor — Service Manager",
  description: "Record services, track balances, share statements.",
  applicationName: "TSMS",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FAFAF7",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const raw = cookieStore.get("tsms_locale")?.value;
  const locale: Locale = raw === "ta" ? "ta" : "en";

  return (
    <html lang={locale} className={`${inter.variable} ${notoTamil.variable}`}>
      <body className="antialiased" suppressHydrationWarning>
        <Providers initialLocale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
