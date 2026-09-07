import React, { useState, useEffect } from "react";
import { Menu, ArrowLeft } from "lucide-react";
import { ViewState } from "../types";

type Props = {
  view: ViewState;
  setView: (v: ViewState) => void;
  setIsMenuOpen: (v: boolean) => void;
};

export default function Header({ view, setView, setIsMenuOpen }: Props) {
  const isTopLevel = ["SHOP", "MYPAGE", "RESULT"].includes(view);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // ▼ スクロール方向を検知してヘッダーを隠す/出す処理
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsVisible(false); // 下スクロールで隠す
      } else {
        setIsVisible(true);  // 上スクロールでひょっこり出す
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
      
      {/* ▼ ロゴをさらに拡大 (h-9 -> h-12) */}
      <div className="flex-1 flex justify-center items-center py-1">
        {isTopLevel ? (
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
        <h1 className={`text-xl font-bold tracking-tight text-red-600 text-center truncate ${isTopLevel ? 'hidden' : ''}`}>
          {view === "DETAIL" ? "商品詳細" : view === "CART" ? "買い物かご" : view === "MYPAGE" ? "マイページ" : "カッタツモリ"}
        </h1>
      </div>
      <div className="w-12"></div>
    </header>
  );
}