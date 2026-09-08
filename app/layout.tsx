import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "カッタツモリ | 妄想通販プラットフォーム",
  description: "日本最大級の妄想通販サイト。ストレス発散にどうぞ！実際にはお金は減りません。",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.json",
  other: {
    "google-adsense-account": "ca-pub-7372592854852772",
  },
  // ▼ ここからが追加したOGP（SNSシェア用）の設定です！
  openGraph: {
    title: "カッタツモリ | お金が減らない妄想通販",
    description: "ストレス発散に最高！お金が減らない合法ドーパミン爆買いアプリ誕生。",
    url: "https://dopamine-rush.shop",
    siteName: "カッタツモリ",
    images: [
      {
        url: "https://dopamine-rush.shop/og-image.png",
        width: 1200,
        height: 630,
        alt: "カッタツモリ OGP画像",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "カッタツモリ | お金が減らない妄想通販",
    description: "ストレス発散に最高！お金が減らない合法ドーパミン爆買いアプリ誕生。",
    images: ["https://dopamine-rush.shop/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* ▼ .ico から .png に修正してあります！ */}
        <link rel="icon" href="/favicon.png" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />

        {/* ==========================================
            ▼ Google Tag Manager ▼
        ========================================== */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-5RJWTNJQ');
            `,
          }}
        />

        {/* ==========================================
            ▼ Google Analytics (GA4) 追加部分 ▼
        ========================================== */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=G-28KGP9VGZC`}
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-28KGP9VGZC', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />

        {/* ==========================================
            ▼ Google AdSense 広告スクリプト ▼
        ========================================== */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7372592854852772"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {/* ==========================================
            ▼ Google Tag Manager (noscript) ▼
        ========================================== */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5RJWTNJQ"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {children}
      </body>
    </html>
  );
}