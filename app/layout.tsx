import type { Metadata } from "next";
import { Noto_Sans_KR, Playfair_Display } from "next/font/google";
import "./globals.css";
import "./quick-add.css";

const sans = Noto_Sans_KR({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const serif = Playfair_Display({ variable: "--font-serif", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "wordnotes — 나만의 영어 단어장",
  description: "모르는 영어 단어와 표현을 모으고, 문장으로 익히는 개인 단어장",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body className={`${sans.variable} ${serif.variable}`}>{children}</body></html>;
}
