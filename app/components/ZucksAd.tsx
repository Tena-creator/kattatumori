"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  type: "banner" | "rectangle";
};

export default function ZucksAd({ type }: Props) {
  const width = type === "banner" ? 320 : 300;
  const height = type === "banner" ? 100 : 250;
  const frameId = type === "banner" ? "736767" : "736768";

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // ▼ コンテナの幅に合わせて広告を自動で縮小（スケール）する処理
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        // 広告の幅(300 or 320)よりも枠が狭い場合、その比率に合わせて縮小する
        if (containerWidth > 0 && containerWidth < width) {
          setScale(containerWidth / width);
        } else {
          setScale(1);
        }
      }
    };

    // 初回と、メニューが開いた後のアニメーション完了時にサイズを計算
    handleResize();
    const timer = setTimeout(handleResize, 150);
    
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [width]);

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
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        <script type="text/javascript" src="https://j.zucks.net.zimg.jp/j?f=${frameId}"></script>
      </body>
    </html>
  `;

  return (
    <div 
      ref={containerRef} 
      className="flex justify-center w-full my-4"
      style={{ height: `${height * scale}px` }} // 縮小した分だけ高さも詰める
    >
      <div style={{ 
        width: `${width}px`, 
        height: `${height}px`, 
        transform: `scale(${scale})`, 
        transformOrigin: "top center" // 上部中央を基準に縮小
      }}>
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
            display: "block"
          }}
          title={`Zucks Ad ${type}`}
        />
      </div>
    </div>
  );
}