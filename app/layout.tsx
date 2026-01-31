import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';

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
        className="antialiased"
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}