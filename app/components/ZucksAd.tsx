"use client";

import React from "react";

type Props = {
  type: "banner" | "rectangle";
};

export default function ZucksAd({ type }: Props) {
  // 審査通過したZucksの本番ID
  const frameId = type === "banner" ? "736767" : "736768";
  const width = 300;
  const height = type === "banner" ? 100 : 250;

  // SPA（Next.js）環境で画面が真っ白になるエラーを防ぐため、iframe内に隔離して広告を展開します
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="ja">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            background-color: transparent; 
          }
        </style>
      </head>
      <body>
        <script type="text/javascript" src="https://j.zucks.net.zimg.jp/j?f=${frameId}"></script>
      </body>
    </html>
  `;

  return (
    <div className="flex justify-center w-full my-4">
      <iframe
        srcDoc={htmlContent}
        width={width}
        height={height}
        scrolling="no"
        frameBorder="0"
        style={{ 
          border: "none", 
          overflow: "hidden", 
          width: `${width}px`, 
          height: `${height}px`,
          maxWidth: "100%"
        }}
        title={`Zucks Ad ${type}`}
      />
    </div>
  );
}