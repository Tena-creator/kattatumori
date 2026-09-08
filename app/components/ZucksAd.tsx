"use client";

import React, { useEffect, useRef } from "react";

type Props = {
  type?: "rectangle" | "banner"; 
  frameId?: string; 
};

export default function ZucksAd({ type = "rectangle", frameId }: Props) {
  const adRef = useRef<HTMLDivElement>(null);

  // ▼ サイズに応じて自動でタグIDを切り替え
  const currentFrameId = frameId || (type === "banner" ? "736767" : "736768");
  const isBanner = type === "banner";

  useEffect(() => {
    // すでに広告タグが挿入されている場合は二重表示を防止
    if (!adRef.current || adRef.current.hasChildNodes()) return;

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `https://j.zucks.net.zimg.jp/j?f=${currentFrameId}`;
    script.async = true;
    
    adRef.current.appendChild(script);
  }, [currentFrameId]);

  return (
    // 上下の均等な余白（my-6）
    <div className="w-full flex justify-center my-6">
      <div 
        ref={adRef} 
        className={`flex items-center justify-center bg-gray-50/50 overflow-hidden ${
          isBanner ? "w-[320px] min-h-[100px]" : "w-[300px] min-h-[250px]"
        }`}
      />
    </div>
  );
}