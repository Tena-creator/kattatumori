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
    <header className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-200 p-4 z-50 flex items-center justify-between shadow-sm">
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
      
      {/* ▼ ここで先ほどのロゴ画像（logo.png）を読み込みます！ 画像がない場合はテキスト表示 */}
      <div className="flex-1 flex justify-center items-center">
        {view === "SHOP" || view === "MYPAGE" || view === "RESULT" ? (
          <img src="/logo.png" alt="カッタツモリ" className="h-6 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
        ) : null}
        <h1 className={`text-xl font-bold tracking-tight text-red-600 text-center truncate ${view === "SHOP" || view === "MYPAGE" || view === "RESULT" ? 'hidden' : ''}`}>
          {view === "DETAIL" ? "商品詳細" : view === "CART" ? "買い物かご" : view === "MYPAGE" ? "マイページ" : "カッタツモリ"}
        </h1>
      </div>
      <div className="w-12"></div>
    </header>
  );
}