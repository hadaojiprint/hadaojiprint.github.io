import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ウェアプリントLAB｜オリジナルTシャツの作り方が分かる",
  description: "オリジナルTシャツやウェアプリントの疑問を、プリント現場の目線で分かりやすく解説するメディアです。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
