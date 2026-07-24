import "./globals.css";

import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

import { CookieConsentBanner } from "@/components/shared/cookie-consent-banner";
import { GoogleAnalytics } from "@/components/shared/google-analytics";
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/shared/json-ld";
import { siteConfig } from "@/config/site";
import { CookieConsentProvider } from "@/hooks/use-cookie-consent";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

const defaultTitle = `${siteConfig.name} — ${siteConfig.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: defaultTitle,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: defaultTitle,
    description: siteConfig.description,
    url: siteConfig.url,
    images: [{ url: "/images/garden-after.jpg", width: 1717, height: 916 }],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: siteConfig.description,
    images: ["/images/garden-after.jpg"],
  },
  other: {
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport: Viewport = {
  themeColor: "#c65a2c",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="bg-canvas text-ink flex min-h-full flex-col font-sans">
        <OrganizationJsonLd />
        <WebsiteJsonLd />
        <CookieConsentProvider>
          {children}
          <GoogleAnalytics />
          <CookieConsentBanner />
        </CookieConsentProvider>
        <Analytics />
      </body>
    </html>
  );
}
