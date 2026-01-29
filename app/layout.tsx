import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';

// Load the ABCDiatype font (Regular and Bold only)
const abcdDiatype = localFont({
  src: [
    { path: "./fonts/ABCDiatype-Regular.otf", weight: "400" },
    { path: "./fonts/ABCDiatype-Bold.otf", weight: "700" },
  ],
  variable: "--font-abcd-diatype",
});

// Load the Reckless font (Regular and Medium only)
const reckless = localFont({
  src: [
    { path: "./fonts/RecklessTRIAL-Regular.woff2", weight: "400" },
    { path: "./fonts/RecklessTRIAL-Medium.woff2", weight: "500" },
  ],
  variable: "--font-reckless",
});

export const metadata: Metadata = {
  title: "Search at Tip of the Tongue",
  description: "Voice-powered search that finds what you're looking for, even when it's on the tip of your tongue.",
  openGraph: {
    title: 'Search at Tip of the Tongue',
    description: 'Voice-powered search that finds what you\'re looking for, even when it\'s on the tip of your tongue.',
    images: ['https://companyresearcher.exa.ai/opengraph-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Search at Tip of the Tongue',
    description: 'Voice-powered search that finds what you\'re looking for, even when it\'s on the tip of your tongue.',
    images: ['https://companyresearcher.exa.ai/opengraph-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${abcdDiatype.variable} ${reckless.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}