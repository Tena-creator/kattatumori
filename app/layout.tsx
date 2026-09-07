import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// ▼ Next.js専用のスクリプト読み込みコンポーネントを追加
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ▼ タイトルと説明文をカッタツモリ用に変更
export const metadata: Metadata = {
  title: "カッタツモリ | 妄想通販プラットフォーム",
  description: "日本最大級の妄想通販サイト。ストレス発散にどうぞ！実際にはお金は減りません。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja" // ▼ en から ja に変更
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* ==========================================
            ▼ Google Tag Manager (Script部分) ▼
        ========================================== */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-5RJWTNJQ');
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        {/* ==========================================
            ▼ Google Tag Manager (noscript部分) ▼
        ========================================== */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-5RJWTNJQ"
            height="0" 
            width="0" 
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        {children}
      </body>
    </html>
  );
}