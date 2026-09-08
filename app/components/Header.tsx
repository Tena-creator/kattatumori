import React, { useState, useEffect } from "react";
import { Menu, ArrowLeft } from "lucide-react";
import { ViewState } from "../types";

type Props = {
  view: ViewState;
  setView: (v: ViewState) => void;
  setIsMenuOpen: (v: boolean) => void;
};

export default function Header({ view, setView, setIsMenuOpen }: Props) {
  // ハンバーガーメニューを出す画面（トップレベル）
  const isTopLevel = ["SHOP", "MYPAGE", "RESULT"].includes(view);
  
  // ▼ ロゴ画像を出す画面（ここに固定ページを追加しました！）
  const showLogo = ["SHOP", "MYPAGE", "RESULT", "HOWTO", "PRIVACY", "TERMS", "CONTACT"].includes(view);

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsVisible(false); // 下スクロールで隠す
      } else {
        setIsVisible(true);  // 上スクロールで出す
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleBack = () => {
    if (["DETAIL", "HOWTO", "PRIVACY", "TERMS", "CONTACT"].includes(view)) setView("SHOP");
    if (view === "CART") setView("SHOP");
    if (view === "ADDRESS") setView("CART");
    if (view === "PAYMENT") setView("ADDRESS");
    if (view === "CONFIRM") setView("PAYMENT");
  };

  // テキスト表示用のタイトル
  let titleText = "";
  if (view === "DETAIL") titleText = "商品詳細";
  else if (view === "CART") titleText = "買い物かご";
  else if (view === "ADDRESS") titleText = "お届け先情報";
  else if (view === "PAYMENT") titleText = "お支払い方法";
  else if (view === "CONFIRM") titleText = "注文確認";

  return (
    <header 
      className={`sticky top-0 bg-white/95 backdrop-blur border-b border-gray-200 p-3.5 z-50 flex items-center justify-between shadow-sm transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <div className="w-12 flex justify-start">
        {isTopLevel ? (
          <button onClick={() => setIsMenuOpen(true)} className="text-gray-500 hover:text-gray-900 transition p-1 lg:hidden">
            <Menu className="w-6 h-6" />
          </button>
        ) : view !== "LOADING" ? (
          <button onClick={handleBack} className="text-gray-500 hover:text-gray-900 transition p-1">
            <ArrowLeft className="w-6 h-6" />
          </button>
        ) : null}
      </div>
      
      <div className="flex-1 flex justify-center items-center py-1">
        {showLogo ? (
          <img 
            src="/logo.png" 
            alt="カッタツモリ" 
            className="h-12 max-w-[220px] object-contain" 
            onError={(e) => { 
              e.currentTarget.style.display = 'none'; 
              const next = e.currentTarget.nextElementSibling;
              if (next) next.classList.remove('hidden'); 
            }} 
          />
        ) : null}
        <h1 className={`text-xl font-bold tracking-tight text-red-600 text-center truncate ${showLogo ? 'hidden' : ''}`}>
          {titleText || "カッタツモリ"}
        </h1>
      </div>
      <div className="w-12"></div>
    </header>
  );
}