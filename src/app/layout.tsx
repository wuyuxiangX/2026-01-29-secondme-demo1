import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SecondMe | Agent 网络",
  description: "让你的数字分身帮你连接资源、实现想法",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${inter.variable} antialiased bg-slate-50 text-slate-900`}
        style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
      >
        {children}
      </body>
    </html>
  );
}
