import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://number-rants-explorer.openai.site"),
  title: {
    default: "Number Rants Explorer",
    template: "%s · Number Rants Explorer",
  },
  description:
    "AI librarians adapt an English research question across historical languages and return cited texts for human interpretation.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Translate the question. Not the library.",
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
