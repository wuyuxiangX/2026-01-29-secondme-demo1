import type { Metadata } from "next";
import { JetBrains_Mono, Orbitron } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const orbitron = Orbitron({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "SecondMe | Agent Network",
  description: "让你的数字分身帮你连接资源、实现想法",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body
        className={`${jetbrainsMono.variable} ${orbitron.variable} antialiased bg-[#0a0a0f] text-[#e4e4e7]`}
        style={{ fontFamily: 'var(--font-mono), monospace' }}
      >
        {/* Cyber Grid Background */}
        <div className="cyber-grid" />
        <div className="scanlines" />

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
