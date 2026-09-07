import React from "react";
import { Star, Store } from "lucide-react";
import { Item } from "../types";

type Props = {
  item: Item;
  onClick: () => void;
};

export default function ProductCard({ item, onClick }: Props) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl p-3 shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-gray-100 flex gap-3 cursor-pointer hover:shadow-md transition active:scale-[0.98]"
    >
      <img src={item.image} alt={item.name} className="w-28 h-28 object-cover rounded-lg shrink-0 bg-gray-50 border border-gray-100" />
      <div className="flex flex-col justify-between flex-1 overflow-hidden">
        <h3 className="text-sm font-medium leading-snug line-clamp-2 text-gray-800">{item.name}</h3>
        <div className="mt-1">
          <span className="text-red-600 font-bold text-lg">¥{item.price.toLocaleString()}</span>
          <span className="text-xs text-gray-500 ml-1">送料無料</span>
        </div>
        <div className="flex items-center text-xs text-yellow-500 mt-1">
          <Star className="w-3 h-3 fill-current" />
          <span className="ml-1 font-bold text-gray-700">{item.rating > 0 ? item.rating.toFixed(2) : "-"}</span>
          <span className="text-gray-400 ml-1">({item.reviews.toLocaleString()}件)</span>
        </div>
        <div className="text-xs text-red-600 mt-1 flex items-center truncate bg-red-50 w-fit px-2 py-0.5 rounded text-[10px] font-bold">
          <Store className="w-3 h-3 mr-1 shrink-0" />
          {item.shopName}
        </div>
      </div>
    </div>
  );
}