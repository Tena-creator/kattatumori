import React from "react";
import { Home, Search, ShoppingCart, User } from "lucide-react";
import { ViewState } from "../types";

type Props = {
  view: ViewState;
  setView: (v: ViewState) => void;
  cartCount: number;
  isBottomCategoryOpen: boolean;
  setIsBottomCategoryOpen: (v: boolean) => void;
};

export default function BottomNav({ view, setView, cartCount, isBottomCategoryOpen, setIsBottomCategoryOpen }: Props) {
  if (!["SHOP", "CART", "MYPAGE", "RESULT", "HOWTO", "PRIVACY", "TERMS", "CONTACT"].includes(view)) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-gray-200 pb-safe z-50 lg:hidden">
      <div className="flex justify-around items-center px-2 py-3">
        <button onClick={() => { setView("SHOP"); setIsBottomCategoryOpen(false); window.scrollTo(0,0); }} className={`flex flex-col items-center gap-1 w-20 transition ${view === 'SHOP' ? 'text-red-600' : 'text-gray-400 hover:text-gray-700'}`}>
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">ホーム</span>
        </button>
        
        <button onClick={() => setIsBottomCategoryOpen(true)} className={`relative flex flex-col items-center gap-1 w-20 transition ${isBottomCategoryOpen ? 'text-red-600' : 'text-gray-400 hover:text-gray-700'}`}>
          <Search className="w-6 h-6" />
          <span className="text-[10px] font-medium">カテゴリ</span>
        </button>

        <button onClick={() => { setView("CART"); setIsBottomCategoryOpen(false); window.scrollTo(0,0); }} className={`relative flex flex-col items-center gap-1 w-20 transition ${view === 'CART' ? 'text-red-600' : 'text-gray-400 hover:text-gray-700'}`}>
          <ShoppingCart className="w-6 h-6" />
          <span className="text-[10px] font-medium">カート</span>
          {cartCount > 0 && (
            <span className="absolute -top-1 right-3 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">{cartCount}</span>
          )}
        </button>
        
        <button onClick={() => { setView("MYPAGE"); setIsBottomCategoryOpen(false); window.scrollTo(0,0); }} className={`flex flex-col items-center gap-1 w-20 transition ${view === 'MYPAGE' ? 'text-red-600' : 'text-gray-400 hover:text-gray-700'}`}>
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">マイページ</span>
        </button>
      </div>
    </nav>
  );
}