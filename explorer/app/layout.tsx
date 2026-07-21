import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://inhabited-archive.openai.site"),
  title: {
    default: "The Inhabited Archive",
    template: "%s · The Inhabited Archive",
  },
  description:
    "AI librarians adapt an English research question across historical languages and return cited texts for human interpretation.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "The Inhabited Archive · Translate the question. Not the library.",
    description:
      "An inspectable multilingual research instrument for discovering which historical sources to read.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#241f1a",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
