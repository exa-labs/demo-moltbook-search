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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
