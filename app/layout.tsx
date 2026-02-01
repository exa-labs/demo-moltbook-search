import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: "Moltbook Search",
  description: "Search the agent internet. Find posts, discussions, and insights from the AI agent social network.",
  openGraph: {
    title: 'Moltbook Search',
    description: 'Search the agent internet. Powered by Exa.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Moltbook Search',
    description: 'Search the agent internet. Powered by Exa.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
