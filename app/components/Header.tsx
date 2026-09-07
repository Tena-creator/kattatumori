import React from "react";
import { Menu, ArrowLeft } from "lucide-react";
import { ViewState } from "../types";

type Props = {
  view: ViewState;
  setView: (v: ViewState) => void;
  setIsMenuOpen: (v: boolean) => void;
};

export default function Header({ view, setView, setIsMenuOpen }: Props) {
  const isTopLevel = ["SHOP", "MYPAGE", "RESULT"].includes(view);

  const handleBack = () => {
    if (["DETAIL", "HOWTO", "PRIVACY", "TERMS", "CONTACT"].includes(view)) setView("SHOP");
    if (view === "CART") setView("SHOP");
    if (view === "ADDRESS") setView("CART");
    if (view === "PAYMENT") setView("ADDRESS");
    if (view === "CONFIRM") setView("PAYMENT");
  };

  return (
    <header className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-200 p-3.5 z-50 flex items-center justify-between shadow-sm">
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
      
      {/* ロゴ画像サイズを h-6 -> h-9 (36px) へ拡大し、見栄えを強化 */}
      <div className="flex-1 flex justify-center items-center py-1">
        {isTopLevel ? (
          <img 
            src="/logo.png" 
            alt="カッタツモリ" 
            className="h-9 max-w-[200px] object-contain" 
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