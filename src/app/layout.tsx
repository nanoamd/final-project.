import "./globals.css";

import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

import { CookieConsentBanner } from "@/components/shared/cookie-consent-banner";
import { GoogleAnalytics } from "@/components/shared/google-analytics";
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/shared/json-ld";
import { MetaPixel } from "@/components/shared/meta-pixel";
import { siteConfig } from "@/config/site";
import { env } from "@/env";
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

// Only include verification methods that actually have a real code set —
// an empty content="" tag on an unverified method is worse than no tag.
const otherVerification: Record<string, string> = {};
if (env.NEXT_PUBLIC_BING_SITE_VERIFICATION) {
  otherVerification["msvalidate.01"] = env.NEXT_PUBLIC_BING_SITE_VERIFICATION;
}
if (env.NEXT_PUBLIC_PINTEREST_SITE_VERIFICATION) {
  otherVerification["p:domain_verify"] =
    env.NEXT_PUBLIC_PINTEREST_SITE_VERIFICATION;
}
const verification: Metadata["verification"] = {
  ...(env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : {}),
  ...(Object.keys(otherVerification).length
    ? { other: otherVerification }
    : {}),
};

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
  ...(Object.keys(verification).length ? { verification } : {}),
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
          <MetaPixel />
          <CookieConsentBanner />
        </CookieConsentProvider>
        <Analytics />
      </body>
    </html>
  );
}
