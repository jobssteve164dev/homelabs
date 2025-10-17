import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Orbitron } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HOMELABS Portal - 科幻未来风AI工具门户",
  description: "面向私域流量的科幻未来风AI工具展示门户，提供沉浸式的AI工具浏览和管理体验",
  keywords: ["AI工具", "门户网站", "科幻", "未来感", "私域流量"],
  authors: [{ name: "HOMELABS Team" }],
  openGraph: {
    title: "HOMELABS Portal - 科幻未来风AI工具门户",
    description: "面向私域流量的科幻未来风AI工具展示门户",
    type: "website",
    locale: "zh_CN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${orbitron.variable} antialiased min-h-screen bg-sci-dark text-foreground`}
        suppressHydrationWarning
      >
        <div className="relative min-h-screen">
          {/* 科幻背景效果 */}
          <div className="fixed inset-0 grid-bg opacity-20" />
          <div className="fixed inset-0 particles" />
          
          {/* 主要内容 */}
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
