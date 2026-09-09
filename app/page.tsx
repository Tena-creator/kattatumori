"use client";

import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, ShieldCheck, Loader2, Star, Store, Search, Home, 
  User, Clock, Menu, X, Heart, Bell, Settings, Ticket, Trophy, Globe, ArrowDownUp,
  ShoppingCart, Package, AlertTriangle, Tv, Shirt, Sparkles, Utensils, Car, Smartphone, Grid,
  HelpCircle, Mail, FileText, ChevronDown, ChevronUp, Trash2, Cat, Dog, Ghost, Smile, Crown, Rocket
} from "lucide-react";

import { Item, Order, ViewState } from "./types";
import { APP_CONFIG } from "./config/app";
import { AD_BANNERS } from "./config/ads";
import { PAGE_CONTENT } from "./config/pages";
import { ALL_CATEGORIES } from "./config/categories";

import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import ProductCard from "./components/ProductCard";
import ZucksAd from "./components/ZucksAd"; 
import { supabase } from "./lib/supabase";

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const ICONS = { User, Cat, Dog, Ghost, Smile, Crown, Rocket };

type ProductRow = {
  id: string;
  name?: string | null;
  price?: number | string | null;
  image_url?: string | null;
  rating?: number | string | null;
  reviews?: number | string | null;
  delivery?: string | null;
  shop_name?: string | null;
  description?: string | null;
  url?: string | null;
};

export default function KattaTsumoriApp() {
  const [view, setView] = useState<ViewState>("SHOP");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [cart, setCart] = useState<Item[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [trendingItems, setTrendingItems] = useState<Item[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  
  const [lifetimeAmount, setLifetimeAmount] = useState(0);
  const [lifetimeOrders, setLifetimeOrders] = useState(0);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  
  const [searchInput, setSearchInput] = useState("");
  const [currentKeyword, setCurrentKeyword] = useState(APP_CONFIG.defaultSearchKeyword);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMain, setIsLoadingMain] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  
  const [sortOrder, setSortOrder] = useState("standard");
  const [maxPrice, setMaxPrice] = useState(0);
  const [sliderValue, setSliderValue] = useState(30000);

  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);
  const [isBottomCategoryOpen, setIsBottomCategoryOpen] = useState(false);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [payMethod, setPayMethod] = useState("credit");
  const [cardNum, setCardNum] = useState("");
  const [cvv, setCvv] = useState("");

  const [addressError, setAddressError] = useState("");
  const [paymentError, setPaymentError] = useState("");

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(0);
  
  const [isCheckoutFailed, setIsCheckoutFailed] = useState(false);
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);

  const [cmsPages, setCmsPages] = useState<Record<string, { title: string; content: string }>>({});

  const [userId, setUserId] = useState<string>("");
  const [profileName, setProfileName] = useState<string>("ゲスト");
  const [profileIcon, setProfileIcon] = useState<keyof typeof ICONS>("User");
  const [ageGroup, setAgeGroup] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [favorites, setFavorites] = useState<Item[]>([]);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [globalSales, setGlobalSales] = useState<number>(APP_CONFIG.globalBaseSales);

  const activeBanners = AD_BANNERS ? AD_BANNERS.filter((b: any) => b.isActive) : [];

  useEffect(() => {
    const initSupabase = async () => {
      let storedUserId = localStorage.getItem("kattatsumori_userId");
      const storedName = localStorage.getItem("kattatsumori_profileName");
      const storedIcon = localStorage.getItem("kattatsumori_profileIcon") as keyof typeof ICONS;
      
      if (storedName) setProfileName(storedName);
      if (storedIcon && ICONS[storedIcon]) setProfileIcon(storedIcon);

      if (!storedUserId) {
        storedUserId = generateUUID();
        localStorage.setItem("kattatsumori_userId", storedUserId);
        await supabase.from('profiles').insert([{ id: storedUserId }]);
      } else {
        const { data } = await supabase.from('profiles').select('*').eq('id', storedUserId).single();
        if (data) {
          setAgeGroup(data.age_group || "");
          setGender(data.gender || "");
        }
      }
      setUserId(storedUserId);

      const { data: favData } = await supabase.from('favorites').select('*').eq('user_id', storedUserId);
      if (favData) {
        const mappedFavs = favData.map(f => ({
          id: f.item_id, name: f.item_name, price: f.price, image: f.image_url,
          rating: 0, reviews: 0, delivery: "", shopName: "", description: "", url: ""
        }));
        setFavorites(mappedFavs);
      }

      const { data: ordersData } = await supabase.from('orders').select('total_amount').limit(3000);
      if (ordersData) {
        const sum = ordersData.reduce((acc, order) => acc + Number(order.total_amount || 0), 0);
        setGlobalSales(APP_CONFIG.globalBaseSales + sum);
      }
    };
    initSupabase();
  }, []);

  const handleSaveProfile = async () => {
    localStorage.setItem("kattatsumori_profileName", profileName || "ゲスト");
    localStorage.setItem("kattatsumori_profileIcon", profileIcon);
    if (userId) {
      await supabase.from('profiles').update({ age_group: ageGroup, gender: gender }).eq('id', userId);
    }
    setIsEditingProfile(false);
    fetchProducts(currentKeyword, 1, true, sortOrder, maxPrice);
  };

  const toggleFavorite = async (item: Item) => {
    if (!userId) return;
    const isFav = favorites.some(f => f.id === item.id);
    if (isFav) {
      setFavorites(favorites.filter(f => f.id !== item.id));
      await supabase.from('favorites').delete().eq('user_id', userId).eq('item_id', item.id);
    } else {
      setFavorites([...favorites, item]);
      await supabase.from('favorites').insert([{
        user_id: userId, item_id: item.id, item_name: item.name, price: item.price, image_url: item.image
      }]);
    }
  };

  useEffect(() => {
    const fetchCmsPages = async () => {
      const domain = process.env.NEXT_PUBLIC_MICROCMS_SERVICE_DOMAIN;
      const apiKey = process.env.NEXT_PUBLIC_MICROCMS_API_KEY;
      if (!domain || !apiKey) return;
      try {
        const res = await fetch(`https://${domain}.microcms.io/api/v1/pages?limit=10`, { headers: { "X-MICROCMS-API-KEY": apiKey } });
        const data = await res.json();
        if (data.contents) {
          const pagesMap: Record<string, { title: string; content: string }> = {};
          data.contents.forEach((item: any) => { pagesMap[item.slug] = { title: item.title, content: item.content }; });
          setCmsPages(pagesMap);
        }
      } catch (e) {}
    };
    fetchCmsPages();
  }, []);

  useEffect(() => {
    const savedHistory = localStorage.getItem("kattatsumori_orderHistory");
    const savedLifetimeAmt = localStorage.getItem("kattatsumori_lifetimeAmt");
    const savedLifetimeOrd = localStorage.getItem("kattatsumori_lifetimeOrd");
    if (savedHistory) try { setOrderHistory(JSON.parse(savedHistory)); } catch (e) {}
    if (savedLifetimeAmt) setLifetimeAmount(Number(savedLifetimeAmt));
    if (savedLifetimeOrd) setLifetimeOrders(Number(savedLifetimeOrd));
    setIsHistoryLoaded(true);
  }, []);

  const getRank = (amount: number) => {
    if (amount >= 10000000) return { title: "妄想の創造神", color: "text-yellow-600" };
    if (amount >= 1000000) return { title: "妄想石油王", color: "text-purple-500" };
    if (amount >= 500000) return { title: "妄想セレブ", color: "text-red-500" };
    if (amount >= 100000) return { title: "妄想の達人", color: "text-emerald-500" };
    if (amount > 0) return { title: "妄想ビギナー", color: "text-blue-500" };
    return { title: "未体験", color: "text-gray-400" };
  };
  const currentRank = getRank(lifetimeAmount);

  useEffect(() => {
    if (view !== "SHOP" || activeBanners.length === 0) return;
    const timer = setInterval(() => { setCurrentBanner((prev) => (prev + 1) % activeBanners.length); }, 4000);
    return () => clearInterval(timer);
  }, [view, activeBanners.length]);

  const mapProduct = (product: ProductRow): Item => ({
    id: product.id,
    name: product.name || "商品名不明",
    price: Number(product.price || 0),
    // ここで image_url を image に変換しています
    image: product.image_url || "https://placehold.co/600x600/f3f4f6/a1a1aa?text=No+Image",
    rating: Number(product.rating || 0),
    reviews: Number(product.reviews || 0),
    delivery: product.delivery || "通常配送",
    shopName: product.shop_name || "ショップ名不明",
    description: product.description || "説明なし",
    url: product.url || "#",
  });

  const getQueryKeyword = (keyword: string) => {
    const abstractKeywords = ["人気", "ファッション", "コスメ", "日用品", APP_CONFIG.defaultSearchKeyword];
    if (!(ageGroup || gender) || !abstractKeywords.includes(keyword)) return keyword;
    const ageStr = ageGroup ? ageGroup.replace("以上", "") : "";
    const genderStr = gender !== "その他" ? gender : "";
    return `${keyword} ${ageStr} ${genderStr}`.trim();
  };

  // ==========================================
  // 【修正】フェッチしたデータをmapProductに通して画像URLを正しくセットする
  // ==========================================
  const fetchProducts = async (keyword: string, page: number, reset: boolean, sort: string, limitPrice: number) => {
    if (reset) setIsLoadingMain(true); else setIsLoadingMore(true);
    const queryKeyword = getQueryKeyword(keyword).replace(/[%_,()]/g, " ").trim();
    
    try {
      const url = `/api/rakuten?keyword=${encodeURIComponent(queryKeyword || keyword)}&page=${page}&sort=${sort}${limitPrice > 0 ? `&maxPrice=${limitPrice}` : ""}`;
      const response = await fetch(url);
      const data = await response.json();
      
      // ★ ここが抜けていました。data.items を mapProduct に通して image を生成します。
      const fetchedItems: Item[] = Array.isArray(data.items) ? data.items.map(mapProduct) : [];
      
      setHasMoreProducts(fetchedItems.length >= 30);
      
      if (reset) setItems(fetchedItems);
      else setItems((previous) => [...previous, ...fetchedItems]);

      if (reset && fetchedItems.length === 0 && limitPrice > 0) {
        setIsAutoRetrying(true);
        setTimeout(() => {
          setSliderValue(30000); setMaxPrice(0); setIsAutoRetrying(false);
          fetchProducts(keyword, 1, true, sort, 0);
        }, 1000);
      }
    } catch {
      if (reset) { setItems([]); setHasMoreProducts(false); }
    } finally {
      setIsLoadingMain(false); setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const fetchTrending = async () => {
      const { data } = await supabase.from("products")
        .select("id,name,price,image_url,rating,reviews,delivery,shop_name,description,url")
        .order("reviews", { ascending: false }).order("rating", { ascending: false }).limit(10);
      if (data) {
        const mapped = data.map(product => ({
          id: product.id, name: product.name, price: Number(product.price || 0),
          image: product.image_url, rating: Number(product.rating || 0),
          reviews: Number(product.reviews || 0), delivery: product.delivery,
          shopName: product.shop_name, description: product.description, url: product.url
        })) as Item[];
        setTrendingItems(mapped);
      }
    };
    fetchTrending();
  }, []);

  useEffect(() => { fetchProducts(currentKeyword, 1, true, sortOrder, maxPrice); }, [ageGroup, gender]);

  useEffect(() => {
    const handleScroll = () => {
      if (view !== "SHOP") return;
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 300) {
        if (!isLoadingMain && !isLoadingMore && hasMoreProducts && items.length > 0) {
          const nextPage = currentPage + 1;
          setCurrentPage(nextPage);
          fetchProducts(currentKeyword, nextPage, false, sortOrder, maxPrice);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLoadingMain, isLoadingMore, hasMoreProducts, currentPage, currentKeyword, items.length, view, sortOrder, maxPrice]);

  const scrollToProducts = () => {
    setTimeout(() => {
      const element = document.getElementById("product-list-top");
      if (element) {
        const y = element.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleQuickCategory = (keyword: string) => {
    setCurrentKeyword(keyword); setSearchInput(""); setCurrentPage(1); setIsBottomCategoryOpen(false);
    scrollToProducts();
    fetchProducts(keyword, 1, true, sortOrder, maxPrice);
  };

  const handleSearch = (e?: React.KeyboardEvent<HTMLInputElement>) => {
    if (!e || e.key === 'Enter') {
      if (searchInput.trim() !== "") {
        setCurrentKeyword(searchInput); 
        setCurrentPage(1); 
        scrollToProducts();
        fetchProducts(searchInput, 1, true, sortOrder, maxPrice);
      }
    }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value; setSortOrder(newSort); setCurrentPage(1); fetchProducts(currentKeyword, 1, true, newSort, maxPrice);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => setSliderValue(Number(e.target.value));

  const handleSliderRelease = () => {
    const newMaxPrice = sliderValue >= 30000 ? 0 : sliderValue;
    if (maxPrice !== newMaxPrice) {
      setMaxPrice(newMaxPrice); setCurrentPage(1); fetchProducts(currentKeyword, 1, true, sortOrder, newMaxPrice);
    }
  };

  const addToCart = (item: Item) => { setCart([...cart, item]); setView("SHOP"); };

  const handleAddressSubmit = () => {
    if (name.trim().length < 2 || address.trim().length < 2) return setAddressError("※氏名と住所は2文字以上で入力してください。");
    if (!phone.trim()) return setAddressError("※電話番号を入力してください。");
    setAddressError(""); setView("PAYMENT");
  };

  const handlePaymentSubmit = () => {
    if (payMethod === 'credit') {
      const numLength = cardNum.replace(/\D/g, '').length;
      if (numLength < 14) return setPaymentError("※クレジットカード番号の桁数が不足しています（14〜16桁必要です）。");
      if (cvv.trim().length < 3) return setPaymentError("※セキュリティコードの桁数が不足しています（3〜4桁必要です）。");
    }
    setPaymentError(""); setView("CONFIRM");
  };

  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm("この妄想履歴を削除しますか？\n（※全世界売上への貢献額はキープされます）")) {
      const updatedHistory = orderHistory.filter(o => o.id !== orderId);
      setOrderHistory(updatedHistory);
      localStorage.setItem("kattatsumori_orderHistory", JSON.stringify(updatedHistory));
    }
  };

  const handleResetHistory = () => {
    if (window.confirm("購入履歴をすべて消去しますか？\n（※全世界売上への貢献額はキープされます！）")) {
      localStorage.removeItem("kattatsumori_orderHistory");
      setOrderHistory([]);
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);

  useEffect(() => {
    if (view === "LOADING") {
      const timer = setTimeout(async () => {
        const newOrder: Order = { id: `ORD-${Date.now()}`, date: new Date().toLocaleString('ja-JP'), items: [...cart], total: totalAmount, payMethod: payMethod };
        const updatedHistory = [newOrder, ...orderHistory];
        setOrderHistory(updatedHistory);
        localStorage.setItem("kattatsumori_orderHistory", JSON.stringify(updatedHistory));
        
        const newLifetimeAmt = lifetimeAmount + totalAmount;
        const newLifetimeOrd = lifetimeOrders + 1;
        setLifetimeAmount(newLifetimeAmt); setLifetimeOrders(newLifetimeOrd);
        localStorage.setItem("kattatsumori_lifetimeAmt", String(newLifetimeAmt));
        localStorage.setItem("kattatsumori_lifetimeOrd", String(newLifetimeOrd));

        setGlobalSales(prev => prev + totalAmount);

        if (userId) {
          const { data: orderData } = await supabase.from('orders').insert([{ user_id: userId, total_amount: totalAmount }]).select().single();
          if (orderData) {
            const orderItems = cart.map(item => ({
              order_id: orderData.id, item_id: item.id, item_name: item.name, price: item.price
            }));
            await supabase.from('order_items').insert(orderItems);
          }
          await supabase.from('profiles').update({ lifetime_amount: newLifetimeAmt }).eq('id', userId);
        }

        setCart([]); setName(""); setAddress(""); setPhone(""); setCardNum(""); setCvv(""); setPayMethod("credit");
        
        if (Math.random() < 0.0001) {
          setIsCheckoutFailed(true);
        } else {
          setIsCheckoutFailed(false);
        }
        
        setView("RESULT");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [view, cart, totalAmount, orderHistory, payMethod, lifetimeAmount, lifetimeOrders, userId]);

  const ProfileIconElement = ICONS[profileIcon] || User;

  const MenuContent = () => (
    <div className="flex flex-col h-full text-gray-800">
      <div className="p-6 pb-2 border-b border-gray-200">
        <img src="/logo.png" alt="カッタツモリ" className="h-8 object-contain mb-2" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
        <h2 className="hidden text-2xl font-black text-red-600 tracking-tighter">カッタツモリ</h2>
        <p className="text-xs text-gray-500 mt-1">日本最大級・妄想通販プラットフォーム</p>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-3">
          <button onClick={() => { setView("SHOP"); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition ${view === 'SHOP' ? 'bg-red-50 text-red-600 font-bold' : 'hover:bg-gray-100 text-gray-700'}`}><Home className="w-5 h-5" /> ホーム</button>
          <button onClick={() => { setView("MYPAGE"); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition ${view === 'MYPAGE' ? 'bg-red-50 text-red-600 font-bold' : 'hover:bg-gray-100 text-gray-700'}`}><User className="w-5 h-5" /> マイページ</button>
        </div>

        <div className="mt-4 px-6 text-xs text-gray-400 font-bold uppercase tracking-wider">インフォメーション</div>
        <div className="space-y-1 px-3 mt-2">
          <button onClick={() => { setView("PWA"); setIsMenuOpen(false); }} className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-gray-100 transition text-gray-700 text-left leading-snug">
            <Smartphone className="w-5 h-5 shrink-0" /> ホーム画面追加方法
          </button>
          <button onClick={() => { setView("HOWTO"); setIsMenuOpen(false); }} className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-gray-100 transition text-gray-700"><HelpCircle className="w-5 h-5 shrink-0" /> 使い方ガイド</button>
          <button onClick={() => { setView("TERMS"); setIsMenuOpen(false); }} className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-gray-100 transition text-gray-700"><FileText className="w-5 h-5 shrink-0" /> 利用規約</button>
          <button onClick={() => { setView("PRIVACY"); setIsMenuOpen(false); }} className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-gray-100 transition text-gray-700"><ShieldCheck className="w-5 h-5 shrink-0" /> プライバシーポリシー</button>
          <button onClick={() => { setView("CONTACT"); setIsMenuOpen(false); }} className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-gray-100 transition text-gray-700"><Mail className="w-5 h-5 shrink-0" /> お問い合わせ</button>
        </div>
        
        <div className="mt-8 px-6 text-xs text-gray-400 font-bold uppercase tracking-wider">設定とサポート</div>
        <div className="space-y-1 px-3 mt-2">
          <button className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-gray-100 transition text-gray-700"><Settings className="w-5 h-5 shrink-0" /> アカウント設定</button>
          <ZucksAd type="rectangle" />
          <button onClick={handleResetHistory} className="w-full flex items-center justify-center py-2 px-3 rounded-xl hover:bg-red-50 transition text-red-400 hover:text-red-500 text-xs font-medium">妄想履歴をリセット</button>
        </div>
      </div>
    </div>
  );

  const renderStaticPage = (title: string, content: string) => (
    <div className="p-6 animate-in fade-in slide-in-from-right-4 pb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">{title}</h2>
      <div 
        className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-sm text-gray-700 leading-loose [&>img]:w-full [&>img]:rounded-lg [&>img]:my-4 [&>h3]:font-bold [&>h3]:mt-6 [&>h3]:mb-2 [&>h3]:text-red-600 [&>p]:mb-4"
        dangerouslySetInnerHTML={{ __html: content }} 
      />
    </div>
  );

  if (!isHistoryLoaded) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex justify-center">
      
      <aside className="hidden lg:block w-72 h-screen sticky top-0 border-r border-gray-200 bg-white p-2">
        <MenuContent />
      </aside>

      <main className="w-full max-w-md bg-white min-h-screen relative shadow-xl flex flex-col lg:border-r border-gray-200 pb-[72px] lg:pb-0">
        
        {isMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden flex">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
            <div className="relative w-[80%] max-w-[300px] bg-white h-full shadow-2xl animate-in slide-in-from-left">
              <button onClick={() => setIsMenuOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full p-2"><X className="w-5 h-5" /></button>
              <MenuContent />
            </div>
          </div>
        )}

        {isBottomCategoryOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden flex items-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsBottomCategoryOpen(false)}></div>
            <div className="relative w-full bg-white rounded-t-3xl pb-safe shadow-2xl animate-in slide-in-from-bottom-full duration-300">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><Search className="w-5 h-5 text-red-600"/> カテゴリから探す</h3>
                <button onClick={() => setIsBottomCategoryOpen(false)} className="p-1.5 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200"><X className="w-5 h-5"/></button>
              </div>
              <div className="p-4 max-h-[65vh] overflow-y-auto grid grid-cols-2 gap-2 pb-8">
                {ALL_CATEGORIES.map((cat, idx) => (
                  <button key={idx} onClick={() => handleQuickCategory(cat.keyword)} className="text-left text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-3 rounded-xl hover:border-red-500 hover:text-red-600 transition shadow-sm">
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <Header view={view} setView={setView} setIsMenuOpen={setIsMenuOpen} />

        <div className="flex-1 flex flex-col">
          {view === "HOWTO" && renderStaticPage(cmsPages["howto"]?.title || PAGE_CONTENT.howto.title, cmsPages["howto"]?.content || PAGE_CONTENT.howto.content)}
          {view === "PRIVACY" && renderStaticPage(cmsPages["privacy"]?.title || PAGE_CONTENT.privacy.title, cmsPages["privacy"]?.content || PAGE_CONTENT.privacy.content)}
          {view === "TERMS" && renderStaticPage(cmsPages["terms"]?.title || PAGE_CONTENT.terms.title, cmsPages["terms"]?.content || PAGE_CONTENT.terms.content)}
          {view === "CONTACT" && renderStaticPage(cmsPages["contact"]?.title || PAGE_CONTENT.contact.title, cmsPages["contact"]?.content || PAGE_CONTENT.contact.content)}
          
          {view === "PWA" && renderStaticPage(cmsPages["pwa"]?.title || "ホーム画面追加方法", cmsPages["pwa"]?.content || "現在準備中です。")}

          {view === "SHOP" && (
            <div className="p-4 animate-in fade-in flex-1">
              
              <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-y-4 border-red-600 py-8 px-4 mb-6 -mx-4 shadow-[0_10px_30px_rgba(220,38,38,0.2)] flex flex-col items-center justify-center text-center overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-red-600/10 blur-[40px] rounded-full animate-pulse"></div>
                <div className="relative z-10 w-full">
                  <div className="flex items-center justify-center gap-2 text-red-400 font-black tracking-widest text-xs mb-2"><Globe className="w-4 h-4" /><span>カッタツモリ 全世界累計妄想売上</span><Globe className="w-4 h-4" /></div>
                  <div className="flex items-baseline justify-center gap-1 font-black">
                    <span className="text-3xl text-red-200 drop-shadow-md">¥</span><span className="text-5xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-red-100 to-red-500 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">{globalSales.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {activeBanners.length > 0 && (
                <div id="dsp-ad-spot" className="relative w-full aspect-[3/1] mb-6 shadow-sm bg-gray-50">
                  {activeBanners.map((banner: any, index: number) => {
                    const content = banner.imageUrl ? (
                      <div className="relative w-full h-full">
                        <img src={banner.imageUrl} alt={banner.title || "PR広告"} className="w-full h-full object-cover" />
                        <div className="absolute top-0 right-0 bg-white/60 text-gray-500 text-[9px] font-bold px-1.5 py-0.5 z-10">
                          PR
                        </div>
                      </div>
                    ) : (
                      <div className={`w-full h-full flex flex-col justify-center items-center text-white text-center px-4 ${banner.bgClass}`}>
                        <p className="text-[10px] font-bold tracking-widest mb-1 border border-white/50 px-2 py-0.5 rounded-full bg-black/20">{banner.label}</p>
                        <h3 className="text-lg font-black">{banner.title}</h3>
                        <p className="text-xs text-white/90 font-medium mt-1">{banner.subtitle}</p>
                        <div className="absolute top-0 right-0 bg-white/60 text-gray-500 text-[9px] font-bold px-1.5 py-0.5 z-10">
                          PR
                        </div>
                      </div>
                    );

                    return (
                      <div key={banner.id} className={`absolute inset-0 transition-opacity duration-700 ${currentBanner === index ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                        {banner.link ? (
                          <a href={banner.link} target="_blank" rel="noopener noreferrer" className="block w-full h-full cursor-pointer">
                            {content}
                          </a>
                        ) : (
                          <div className="w-full h-full">{content}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {trendingItems.length > 0 && (
                <div className="mb-6 -mx-4 pl-4">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-red-600" /> さっき誰かが妄想決済した商品</h3>
                  <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide pr-4">
                    {trendingItems.map((item, idx) => (
                      <div key={`trend-${idx}`} onClick={() => { setSelectedItem(item); setView("DETAIL"); }} className="w-32 shrink-0 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-gray-100 p-2 cursor-pointer hover:shadow-md transition flex flex-col gap-2">
                        <img src={item.image} className="w-full h-28 object-cover rounded-lg bg-gray-50 border border-gray-100" />
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-medium leading-snug line-clamp-2 text-gray-700 h-7">{item.name}</span>
                          <span className="text-xs font-black text-red-600">¥{item.price.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative mb-6">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 cursor-pointer hover:text-red-500 transition" onClick={() => handleSearch()} />
                <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={handleSearch} placeholder="キーワードで探す (Enterで実行)" className="w-full bg-gray-100 border border-gray-200 rounded-full py-2.5 pl-10 pr-4 text-gray-900 focus:border-red-500 focus:bg-white outline-none text-sm transition shadow-inner" />
              </div>

              <div className="mb-6 border-b border-gray-100 pb-4">
                <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                  <button onClick={() => handleQuickCategory("人気")} className="flex flex-col items-center gap-1 group"><div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center group-hover:bg-red-50 group-hover:text-red-600 transition"><Grid className="w-6 h-6" /></div><span className="text-[10px] font-bold text-gray-600">総合・人気</span></button>
                  <button onClick={() => handleQuickCategory("食品")} className="flex flex-col items-center gap-1 group"><div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-100 transition"><Utensils className="w-6 h-6" /></div><span className="text-[10px] font-bold text-gray-600">食品・グルメ</span></button>
                  <button onClick={() => handleQuickCategory("家電")} className="flex flex-col items-center gap-1 group"><div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition"><Tv className="w-6 h-6" /></div><span className="text-[10px] font-bold text-gray-600">家電・PC</span></button>
                  <button onClick={() => handleQuickCategory("ファッション")} className="flex flex-col items-center gap-1 group"><div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:bg-pink-100 transition"><Shirt className="w-6 h-6" /></div><span className="text-[10px] font-bold text-gray-600">ファッション</span></button>
                  <button onClick={() => handleQuickCategory("コスメ")} className="flex flex-col items-center gap-1 group"><div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition"><Sparkles className="w-6 h-6" /></div><span className="text-[10px] font-bold text-gray-600">美容・コスメ</span></button>
                  <button onClick={() => handleQuickCategory("日用品")} className="flex flex-col items-center gap-1 group"><div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-100 transition"><Package className="w-6 h-6" /></div><span className="text-[10px] font-bold text-gray-600">日用品雑貨</span></button>
                  <button onClick={() => handleQuickCategory("車 バイク")} className="flex flex-col items-center gap-1 group"><div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-600 flex items-center justify-center group-hover:bg-zinc-200 transition"><Car className="w-6 h-6" /></div><span className="text-[10px] font-bold text-gray-600">車・バイク</span></button>
                  <button onClick={() => handleQuickCategory("スマートフォン")} className="flex flex-col items-center gap-1 group"><div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition"><Smartphone className="w-6 h-6" /></div><span className="text-[10px] font-bold text-gray-600">スマホ</span></button>
                </div>
                <div className="flex justify-center mt-3">
                  <button onClick={() => setIsCategoryExpanded(!isCategoryExpanded)} className="flex flex-col items-center text-[10px] font-bold text-gray-400 hover:text-red-500 transition">
                    {isCategoryExpanded ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5 animate-bounce"/>}
                    {isCategoryExpanded ? "閉じる" : "さらにカテゴリを見る"}
                  </button>
                </div>
                {isCategoryExpanded && (
                  <div className="mt-4 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 border-t border-gray-100 pt-4">
                    {ALL_CATEGORIES.slice(8).map((cat, idx) => (
                      <button key={idx} onClick={() => { handleQuickCategory(cat.keyword); setIsCategoryExpanded(false); }} className="text-left text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-lg hover:border-red-500 hover:text-red-600 transition truncate shadow-sm">
                        {cat.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div id="product-list-top"></div>

              <div className="flex flex-col gap-3 mb-6">
                {!isLoadingMain && items.length > 0 && (
                  <div className="flex justify-between items-center px-1">
                    <div className="text-xs font-bold text-gray-500 flex items-center gap-1"><Store className="w-3 h-3" /> {items.length}件</div>
                    <div className="relative">
                      <select value={sortOrder} onChange={handleSortChange} className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg pl-3 pr-8 py-1.5 outline-none focus:border-red-500 cursor-pointer">
                        <option value="standard">おすすめ順</option>
                        <option value="+itemPrice">価格が安い順</option>
                        <option value="-itemPrice">価格が高い順</option>
                      </select>
                      <ArrowDownUp className="absolute right-2 top-1.5 w-3 h-3 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-full border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-600 whitespace-nowrap w-16">予算: {sliderValue >= 30000 ? '指定なし' : `〜¥${(sliderValue / 1000)}k`}</span>
                  <input type="range" min="1000" max="30000" step="1000" value={sliderValue} onChange={handleSliderChange} onMouseUp={handleSliderRelease} onTouchEnd={handleSliderRelease} className="flex-1 h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-red-600" />
                </div>
              </div>

              {isLoadingMain ? (
                <div className="flex justify-center py-32"><Loader2 className="w-10 h-10 text-red-600 animate-spin" /></div>
              ) : (
                <>
                  {items.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 animate-in fade-in">
                      {isAutoRetrying ? (
                        <>
                          <Loader2 className="w-10 h-10 text-red-600 animate-spin mx-auto mb-4" />
                          <p className="font-bold text-gray-700">条件に合う商品が見つかりません。</p>
                          <p className="text-xs mt-2 text-gray-500">予算上限を外して自動再検索しています...</p>
                        </>
                      ) : (
                        <>
                          <p>商品が見つかりませんでした😢</p>
                          <button onClick={() => { setSliderValue(30000); setMaxPrice(0); fetchProducts(currentKeyword, 1, true, sortOrder, 0); }} className="mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-full text-sm font-bold shadow-sm">上限を外して再検索</button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {items.map((item, index) => (
                        <React.Fragment key={`${item.id}-${index}`}>
                          <ProductCard item={item} onClick={() => { setSelectedItem(item); setView("DETAIL"); }} />
                          {(index + 1) % 30 === 0 && (
                            <ZucksAd type="banner" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                  {isLoadingMore && <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-red-600 animate-spin" /></div>}
                </>
              )}
            </div>
          )}

          {view === "MYPAGE" && (
            <div className="space-y-6 p-4 animate-in fade-in pb-12 flex flex-col h-full">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-6 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-50 rounded-full blur-2xl"></div>
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border-2 border-red-600 shrink-0 shadow-sm overflow-hidden">
                    <ProfileIconElement className="w-8 h-8 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900 truncate">{profileName} 様</h2>
                    <div className="flex items-center gap-1 mt-1"><Trophy className={`w-4 h-4 ${currentRank.color}`} /><p className={`text-sm font-bold ${currentRank.color}`}>{currentRank.title}</p></div>
                  </div>
                </div>

                <div className="relative z-10">
                  {isEditingProfile ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">ニックネーム</label>
                        <input type="text" value={profileName} onChange={(e)=>setProfileName(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-red-400" placeholder="ゲスト" />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">アイコン</label>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(ICONS).map((iconKey) => {
                            const IconComp = ICONS[iconKey as keyof typeof ICONS];
                            return (
                              <button key={iconKey} onClick={() => setProfileIcon(iconKey as keyof typeof ICONS)} className={`p-2.5 rounded-full border transition shadow-sm ${profileIcon === iconKey ? 'border-red-500 bg-red-50 text-red-500 scale-110' : 'border-gray-200 bg-white text-gray-400 hover:bg-gray-100'}`}>
                                <IconComp className="w-5 h-5" />
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">年代 (任意)</label>
                          <select value={ageGroup} onChange={(e)=>setAgeGroup(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-red-400">
                            <option value="">未設定</option>
                            <option value="10代">10代</option><option value="20代">20代</option><option value="30代">30代</option>
                            <option value="40代">40代</option><option value="50代">50代</option><option value="60代以上">60代以上</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">性別 (任意)</label>
                          <select value={gender} onChange={(e)=>setGender(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-red-400">
                            <option value="">未設定</option>
                            <option value="女性">女性</option><option value="男性">男性</option><option value="その他">その他</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                        <button onClick={() => setIsEditingProfile(false)} className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded-lg transition">キャンセル</button>
                        <button onClick={handleSaveProfile} className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm">保存して最適化</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setIsEditingProfile(true)} className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-full flex items-center gap-1 transition shadow-sm">
                        <Settings className="w-3 h-3"/> プロフィールを編集
                      </button>
                      {(ageGroup || gender) && (
                        <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded-full">
                          {ageGroup} {gender}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-5 relative z-10">
                  <div><p className="text-xs text-gray-500 mb-1">個人の生涯妄想額</p><p className="text-2xl font-black text-gray-900">¥<span className="text-red-600">{lifetimeAmount.toLocaleString()}</span></p></div>
                  <div><p className="text-xs text-gray-500 mb-1">総注文数</p><p className="text-2xl font-black text-gray-900">{lifetimeOrders} <span className="text-sm font-normal text-gray-500">回</span></p></div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Heart className="w-5 h-5 text-pink-500" />お気に入り</h3>
                {favorites.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-500 shadow-sm">
                    <Heart className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs mt-2">気になる商品は「♡」で保存しよう！</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {favorites.map((fav) => (
                      <div key={fav.id} onClick={() => { setSelectedItem(fav); setView("DETAIL"); }} className="bg-white border border-gray-200 rounded-xl p-2 cursor-pointer shadow-sm relative hover:shadow-md transition group">
                        <img src={fav.image} className="w-full h-24 object-cover rounded-lg mb-2 bg-gray-50" />
                        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(fav); }} className="absolute top-3 right-3 bg-white/80 p-1.5 rounded-full shadow-sm hover:scale-110 transition"><Heart className="w-4 h-4 text-pink-500 fill-current" /></button>
                        <p className="text-[10px] text-gray-800 line-clamp-2 h-7 group-hover:text-red-600 transition">{fav.name}</p>
                        <p className="text-xs font-bold text-red-600 mt-1">¥{fav.price.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 mt-6"><Clock className="w-5 h-5 text-red-600" />購入履歴</h3>
                {orderHistory.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500 shadow-sm"><ShoppingBag className="w-10 h-10 mx-auto mb-3 text-gray-300" /><p>履歴はリセットされています</p></div>
                ) : (
                  <div className="space-y-4">
                    {orderHistory.map((order) => (
                      <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{order.date}</span>
                            <span className="text-[10px] font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded">妄想完了</span>
                          </div>
                          <button onClick={() => handleDeleteOrder(order.id)} className="p-1 hover:bg-red-50 rounded transition group">
                            <Trash2 className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition" />
                          </button>
                        </div>
                        
                        <div className="space-y-3 mb-3">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex gap-3 items-center">
                              <img src={item.image} className="w-12 h-12 shrink-0 rounded-md object-cover border border-gray-200 bg-gray-50" />
                              <div className="flex-1 overflow-hidden">
                                <p className="text-xs text-gray-800 truncate mb-1">{item.name}</p>
                                <div className="flex gap-2">
                                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-[#BF0000] text-white px-2 py-1 rounded font-bold hover:bg-red-700 transition flex items-center gap-1 shadow-sm"><ShoppingBag className="w-3 h-3"/>楽天で見る</a>
                                  <a href={`https://www.amazon.co.jp/s?k=${encodeURIComponent(item.name)}${APP_CONFIG.affiliate.amazonTag ? `&tag=${APP_CONFIG.affiliate.amazonTag}` : ""}`} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-gray-800 text-white px-2 py-1 rounded font-bold hover:bg-gray-900 transition flex items-center gap-1 shadow-sm"><Package className="w-3 h-3"/>Amazon</a>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-end pt-2 border-t border-gray-100">
                          <span className="text-sm text-gray-500">{order.items.length}点の商品</span><span className="font-bold text-gray-900">合計: <span className="text-red-600 text-lg">¥{order.total.toLocaleString()}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mt-auto pt-8 flex flex-col items-center">
                <ZucksAd type="rectangle" />
                <button onClick={handleResetHistory} className="text-xs text-red-400 hover:text-red-500 hover:underline transition mt-2 py-2">
                  すべての妄想履歴をリセット
                </button>
              </div>
            </div>
          )}

          {view === "DETAIL" && selectedItem && (
            <div className="animate-in fade-in slide-in-from-right-4 bg-white min-h-screen pb-24 relative">
              <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-80 object-cover bg-gray-50 border-b border-gray-200" />
              
              <button 
                onClick={() => toggleFavorite(selectedItem)}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur p-3 rounded-full shadow-lg hover:scale-110 active:scale-95 transition"
              >
                <Heart className={`w-6 h-6 ${favorites.some(f => f.id === selectedItem.id) ? 'fill-pink-500 text-pink-500' : 'text-gray-400'}`} />
              </button>

              <div className="p-4 space-y-4">
                <div className="flex items-center text-sm text-yellow-500"><Star className="w-4 h-4 fill-current" /><span className="ml-1 font-bold text-base text-gray-800">{selectedItem.rating > 0 ? selectedItem.rating.toFixed(2) : "-"}</span><span className="text-gray-500 ml-2">({selectedItem.reviews.toLocaleString()}件)</span></div>
                <h2 className="text-lg font-medium leading-relaxed text-gray-900">{selectedItem.name}</h2>
                <div className="border-y border-gray-100 py-4 my-4"><span className="text-red-600 font-bold text-3xl">¥{selectedItem.price.toLocaleString()}</span><span className="text-sm text-gray-500 ml-2">送料無料</span></div>
                <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700"><p className="font-bold text-red-600 mb-2">{selectedItem.delivery}</p><div className="flex items-center mt-2 border-t border-gray-200 pt-2"><Store className="w-4 h-4 mr-2 text-gray-500" />{selectedItem.shopName}</div></div>
                <div className="text-sm text-gray-600 leading-relaxed pt-2 pb-8 line-clamp-6">{selectedItem.description}</div>
              </div>
              <div className="fixed bottom-0 w-full max-w-md p-4 bg-white/95 backdrop-blur border-t border-gray-200 z-50">
                <div className="flex gap-3">
                  <button onClick={() => setView("SHOP")} className="flex-[3] bg-white text-gray-700 py-4 rounded-xl font-bold text-sm border border-gray-300 hover:bg-gray-50 active:scale-95 transition">戻る</button>
                  <button onClick={() => addToCart(selectedItem)} className="flex-[7] bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-red-500/30 active:scale-95 transition">買い物かごに追加</button>
                </div>
              </div>
            </div>
          )}

          {view === "CART" && (
            <div className="space-y-6 p-4 animate-in fade-in slide-in-from-right-4 pb-12 flex flex-col h-full">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">買い物かご</h2>
                {cart.length === 0 ? (
                  <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-200"><ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">かごは空です</p><button onClick={() => setView("SHOP")} className="mt-6 px-8 py-3 bg-gray-800 rounded-full text-sm text-white font-medium hover:bg-gray-700 active:scale-95 transition">買い物を続ける</button></div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item, i) => (
                      <div key={i} className="flex gap-4 items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                        <img src={item.image} className="w-20 h-20 object-cover rounded-lg shrink-0 bg-gray-50" />
                        <div className="flex-1 flex flex-col justify-between h-20"><span className="font-medium text-sm line-clamp-2 text-gray-900">{item.name}</span><div className="text-red-600 font-bold text-lg">¥{item.price.toLocaleString()}</div></div>
                      </div>
                    ))}
                    <div className="flex justify-between items-end pt-4 border-t border-gray-200 mt-6 px-2"><span className="text-gray-500 font-medium">合計</span><span className="text-red-600 font-bold text-3xl">¥{totalAmount.toLocaleString()}</span></div>
                    <button onClick={() => setView("ADDRESS")} className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg mt-4 shadow-lg shadow-red-500/30 active:scale-95 transition">ご購入手続きへ</button>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-8">
                <ZucksAd type="rectangle" />
              </div>
            </div>
          )}

          {view === "ADDRESS" && (
            <div className="space-y-6 p-4 animate-in fade-in slide-in-from-right-4">
               <div className="bg-red-50 border border-red-200 p-4 rounded-xl shadow-sm space-y-2"><div className="flex items-center gap-2 text-red-700 font-bold"><AlertTriangle className="w-5 h-5" /><span>実際の情報を入力するのがオススメ！</span></div><p className="text-xs text-red-800 leading-relaxed font-medium">よりリアルでスリリングな妄想を楽しむために、ぜひご自身の本当の住所やお名前を入力してみてください。</p><p className="text-[10px] text-red-600/80 leading-relaxed border-t border-red-200/50 pt-2">※入力された情報はシステムに一切保存・送信されません。完全に安全な妄想をお楽しみいただけます。</p></div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">お届け先（架空）</h2>
                <div className="space-y-4">
                  <div><label className="block text-sm text-gray-600 mb-1">氏名 <span className="text-red-500 text-xs">*</span></label><input type="text" value={name} onChange={(e)=>setName(e.target.value)} className={`w-full bg-gray-50 border ${addressError.includes('氏名') ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 text-gray-900 outline-none focus:border-red-500 transition`} placeholder="例：山田 太郎" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">住所 <span className="text-red-500 text-xs">*</span></label><input type="text" value={address} onChange={(e)=>setAddress(e.target.value)} className={`w-full bg-gray-50 border ${addressError.includes('住所') ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 text-gray-900 outline-none focus:border-red-500 transition`} placeholder="例：東京都港区六本木〇-〇-〇" /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">電話番号 <span className="text-red-500 text-xs">*</span></label><input type="tel" value={phone} onChange={(e)=>setPhone(e.target.value)} className={`w-full bg-gray-50 border ${addressError.includes('電話') ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 text-gray-900 outline-none focus:border-red-500 transition`} placeholder="例：090-0000-0000" /></div>
                </div>
              </div>
              {addressError && <p className="text-red-600 font-bold text-sm text-center animate-pulse bg-red-50 py-2 rounded-lg">{addressError}</p>}
              <button onClick={handleAddressSubmit} className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg active:scale-95 transition shadow-lg shadow-red-500/30">次へ</button>
            </div>
          )}

          {view === "PAYMENT" && (
            <div className="space-y-6 p-4 animate-in fade-in slide-in-from-right-4">
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl shadow-sm space-y-2"><div className="flex items-center gap-2 text-red-700 font-bold"><AlertTriangle className="w-5 h-5" /><span>本物のカード情報を入れると興奮度MAX！</span></div><p className="text-[10px] text-red-600/80 leading-relaxed border-t border-red-200/50 pt-2">※入力された情報はシステムに一切保存・送信されません。完全に安全な妄想をお楽しみいただけます。</p></div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">お支払い方法（架空）</h2>
              <div className="space-y-3">
                <label className={`block border p-4 rounded-xl cursor-pointer transition ${payMethod === 'credit' ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}><input type="radio" name="pay" value="credit" checked={payMethod === 'credit'} onChange={()=>setPayMethod('credit')} className="mr-3 accent-red-600" /><span className="font-medium text-gray-900">クレジットカード</span></label>
                <label className={`block border p-4 rounded-xl cursor-pointer transition ${payMethod === 'convenience' ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}><input type="radio" name="pay" value="convenience" checked={payMethod === 'convenience'} onChange={()=>setPayMethod('convenience')} className="mr-3 accent-red-600" /><span className="font-medium text-gray-900">コンビニ払い (前払い)</span></label>
                <label className={`block border p-4 rounded-xl cursor-pointer transition ${payMethod === 'cash_on_delivery' ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}><input type="radio" name="pay" value="cash_on_delivery" checked={payMethod === 'cash_on_delivery'} onChange={()=>setPayMethod('cash_on_delivery')} className="mr-3 accent-red-600" /><span className="font-medium text-gray-900">代金引換 (着払い)</span></label>
                <label className={`block border p-4 rounded-xl cursor-pointer transition ${payMethod === 'bank_transfer' ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}><input type="radio" name="pay" value="bank_transfer" checked={payMethod === 'bank_transfer'} onChange={()=>setPayMethod('bank_transfer')} className="mr-3 accent-red-600" /><span className="font-medium text-gray-900">銀行振込 (前払い)</span></label>
              </div>
              {payMethod === 'credit' && (
                <div className="pt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div><label className="block text-sm text-gray-600 mb-1">カード番号（14桁〜16桁） <span className="text-red-500 text-xs">*</span></label><input type="text" value={cardNum} onChange={(e)=>setCardNum(e.target.value)} className={`w-full bg-gray-50 border ${paymentError.includes('番号') ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 text-gray-900 outline-none focus:border-red-500 transition tracking-widest`} placeholder="（例）4545 1234 5678 9000" maxLength={16}/></div>
                  <div><label className="block text-sm text-gray-600 mb-1">セキュリティコード（3桁〜4桁） <span className="text-red-500 text-xs">*</span></label><input type="password" value={cvv} onChange={(e)=>setCvv(e.target.value)} className={`w-full bg-gray-50 border ${paymentError.includes('セキュリティ') ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 text-gray-900 outline-none focus:border-red-500 transition tracking-widest`} placeholder="（例）123" maxLength={4}/></div>
                </div>
              )}
              {paymentError && <p className="text-red-600 font-bold text-sm text-center animate-pulse bg-red-50 py-2 rounded-lg">{paymentError}</p>}
              <button onClick={handlePaymentSubmit} className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg mt-6 active:scale-95 transition shadow-lg shadow-red-500/30">次へ</button>
            </div>
          )}

          {view === "CONFIRM" && (
            <div className="space-y-6 p-4 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-2xl font-bold text-red-600 border-b border-gray-200 pb-2">妄想注文を確定します</h2>
              <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-4 shadow-sm">
                <p className="font-bold text-gray-900 border-b border-gray-100 pb-2">ご注文商品</p>
                {cart.map((item, i) => (
                  <div key={i} className="flex gap-4 items-start"><img src={item.image} className="w-20 h-20 rounded-lg object-cover shrink-0 border border-gray-200 bg-gray-50" /><div className="flex-1 flex flex-col justify-between h-20"><div className="font-medium text-sm line-clamp-2 text-gray-800 leading-snug">{item.name}</div><div className="font-bold text-lg text-gray-900">¥{item.price.toLocaleString()}</div></div></div>
                ))}
                <div className="border-t border-gray-200 pt-3 flex justify-between items-end mt-2"><p className="text-gray-500 font-medium">ご請求金額</p><p className="font-bold text-4xl text-red-600">¥{totalAmount.toLocaleString()}</p></div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                <div><p className="text-gray-500 text-xs mb-1">お届け先</p><p className="font-medium text-sm text-gray-900">{name} 様</p></div>
                <div className="border-t border-gray-200 pt-3"><p className="text-gray-500 text-xs mb-1">お支払い情報</p><p className="font-medium text-sm text-gray-900">{payMethod === 'credit' && `クレカ (末尾: ${cardNum.slice(-4) || "1234"})`}{payMethod === 'convenience' && 'コンビニ払い (前払い)'}{payMethod === 'cash_on_delivery' && '代金引換 (着払い)'}{payMethod === 'bank_transfer' && '銀行振込 (前払い)'}</p></div>
              </div>
              <div className="space-y-4 pt-2">
                <button onClick={() => setView("LOADING")} className="w-full bg-red-600 text-white py-5 rounded-xl font-bold text-xl shadow-lg shadow-red-500/30 animate-pulse active:scale-95 transition">注文を確定する</button>
                <button onClick={() => setView("CART")} className="w-full bg-white text-gray-700 py-4 rounded-xl font-medium text-sm hover:bg-gray-50 transition active:scale-95 border border-gray-300">キャンセル</button>
              </div>
            </div>
          )}

          {view === "LOADING" && (
            <div className="flex flex-col items-center justify-center py-40 space-y-6 p-4 min-h-screen">
              <Loader2 className="w-16 h-16 text-red-600 animate-spin" />
              <p className="text-xl font-bold tracking-widest text-gray-800">妄想決済中...</p>
            </div>
          )}

          {view === "RESULT" && (
            <div className="space-y-8 py-16 p-4 text-center animate-in fade-in zoom-in duration-500 pb-12 flex flex-col h-full">
              {isCheckoutFailed ? (
                <div>
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
                    <X className="w-10 h-10 text-red-600" />
                  </div>
                  <h2 className="text-4xl font-black text-gray-900 tracking-widest mb-2">決済失敗</h2>
                  <p className="text-lg font-bold text-gray-800 mt-8 mb-2">……びっくりした？</p>
                  <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                    なんちゃって！<br />
                    裏ではちゃんと買えてます。<br />
                    0.01%の確率でこの画面が出る隠し機能でした🥳
                  </p>
                  
                  <div className="pt-4">
                    <button onClick={() => { setIsCheckoutFailed(false); setView("MYPAGE"); window.scrollTo(0,0); }} className="w-full bg-white border border-gray-300 text-gray-700 py-4 rounded-xl font-bold text-sm hover:bg-gray-100 transition active:scale-95 flex items-center justify-center gap-2 shadow-sm">
                      <User className="w-5 h-5 text-gray-400" /> マイページで履歴を見る
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200"><ShieldCheck className="w-10 h-10 text-emerald-600" /></div>
                  <h2 className="text-4xl font-black text-gray-900 tracking-widest mb-2">注文完了</h2>
                  <p className="text-sm text-gray-500 mb-6">※これは妄想です。実際には商品は届かず、お金も減りません。</p>

                  {orderHistory[0]?.payMethod === 'convenience' && (
                    <div className="bg-gray-100 p-5 rounded-xl text-sm mb-6 text-left border border-gray-200"><p className="font-bold text-gray-800 mb-2">コンビニ払込票番号（架空）</p><p className="text-3xl font-black text-gray-900 tracking-widest text-center my-4">9876-5432-1098</p><p className="text-gray-500 text-xs">お近くの架空のコンビニエンスストアのレジにて、上記の番号をお伝えいただき、架空の現金でお支払いください。</p></div>
                  )}
                  {orderHistory[0]?.payMethod === 'bank_transfer' && (
                    <div className="bg-gray-100 p-5 rounded-xl text-sm mb-6 text-left border border-gray-200"><p className="font-bold text-gray-800 mb-3 border-b border-gray-300 pb-2">お振込先口座（架空）</p><div className="space-y-1 text-gray-700 font-medium"><p>妄想銀行 (0000)</p><p>エアブランチ支店 (123)</p><p>普通 <span className="font-bold text-lg tracking-wider">1234567</span></p><p>カ）カッタツモリ</p></div><p className="text-red-500 font-bold text-xs mt-3">※絶対に振り込まないでください。</p></div>
                  )}
                  {orderHistory[0]?.payMethod === 'cash_on_delivery' && (
                    <div className="bg-gray-100 p-5 rounded-xl text-sm mb-6 text-left border border-gray-200"><p className="font-bold text-gray-800 mb-2">商品到着時のお願い</p><p className="text-gray-700">商品（架空）の到着時に、配達員（架空）へ代金 <strong className="text-lg text-red-600">¥{orderHistory[0]?.total.toLocaleString()}</strong> を架空の現金でお支払いください。</p></div>
                  )}

                  <div className="pt-4 space-y-4">
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-center">
                      <p className="text-sm text-gray-800 mb-3 font-bold">＼ 実際に欲しくなった方は ／</p>
                      <p className="text-xs text-gray-600 leading-relaxed mb-5 inline-block text-left">
                        マイページの「購入履歴」を開くと、妄想した各商品を実際のショップ（楽天・Amazon）で確認・購入することができます。
                      </p>
                      
                      <button onClick={() => { setView("MYPAGE"); window.scrollTo(0,0); }} className="w-full bg-white border border-gray-300 text-gray-700 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-100 transition active:scale-95 flex items-center justify-center gap-2 shadow-sm">
                        <User className="w-5 h-5 text-gray-400" /> マイページへ移動する
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-auto pt-8">
                <ZucksAd type="rectangle" />
              </div>
            </div>
          )}

          {view !== "LOADING" && (
            <footer className="border-t border-gray-200 bg-gray-50 py-10 px-4 mt-auto">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs font-medium text-gray-600 mb-8">
                <button onClick={() => { setView("PWA"); window.scrollTo(0,0); }} className="hover:text-red-600 transition">ホーム画面追加方法</button>
                <button onClick={() => { setView("HOWTO"); window.scrollTo(0,0); }} className="hover:text-red-600 transition">使い方ガイド</button>
                <button onClick={() => { setView("CONTACT"); window.scrollTo(0,0); }} className="hover:text-red-600 transition">お問い合わせ</button>
                <button onClick={() => { setView("TERMS"); window.scrollTo(0,0); }} className="hover:text-red-600 transition">利用規約</button>
                <button onClick={() => { setView("PRIVACY"); window.scrollTo(0,0); }} className="hover:text-red-600 transition">プライバシーポリシー</button>
              </div>
              <div className="flex justify-center mb-8">
                <a href="#" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#1A1F2E] text-white px-8 py-3 rounded-full text-xs font-bold hover:bg-black transition shadow-sm active:scale-95">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>公式Xをフォロー
                </a>
              </div>
              <p className="text-center text-[10px] text-gray-400 font-bold tracking-wider">© 2026 カッタツモリ・All Rights Reserved.</p>
            </footer>
          )}
        </div>

        <BottomNav view={view} setView={setView} cartCount={cart.length} isBottomCategoryOpen={isBottomCategoryOpen} setIsBottomCategoryOpen={setIsBottomCategoryOpen} />
      </main>

      <aside className="hidden lg:block w-80 h-screen sticky top-0 p-6 bg-white border-l border-gray-200">
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-md mb-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-red-600" /> 今のカート状況</h3>
          {cart.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">かごは空です</p>
          ) : (
            <div className="space-y-3">
              {cart.slice(0, 3).map((item, i) => (
                <div key={i} className="flex gap-3 items-center border-b border-gray-100 pb-3 last:border-0 last:pb-0"><img src={item.image} className="w-12 h-12 rounded object-cover border border-gray-200" /><div className="flex-1 overflow-hidden"><p className="text-xs text-gray-700 truncate">{item.name}</p><p className="font-bold text-sm text-red-600">¥{item.price.toLocaleString()}</p></div></div>
              ))}
              {cart.length > 3 && <p className="text-xs text-center text-gray-400 pt-2">他 {cart.length - 3} 件</p>}
              <div className="pt-3 border-t border-gray-200 flex justify-between items-center font-bold text-gray-900"><span>合計</span><span className="text-red-600 text-lg">¥{totalAmount.toLocaleString()}</span></div>
              <button onClick={() => setView("CART")} className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg text-sm font-bold transition mt-2 shadow-sm">カートを開く</button>
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-md">
          <div className="flex justify-between items-end mb-4"><h3 className="font-bold text-gray-900 flex items-center gap-2"><Clock className="w-5 h-5 text-red-600" /> 妄想の記録</h3><div className="text-right"><p className="text-[10px] text-gray-500">個人の生涯使用額</p><p className="text-lg font-bold text-gray-900 leading-none">¥<span className="text-red-600">{lifetimeAmount.toLocaleString()}</span></p></div></div>
          {orderHistory.length === 0 ? (<p className="text-sm text-gray-500 text-center py-4 border-t border-gray-100 pt-4">履歴はありません</p>) : (
             <div className="space-y-3 border-t border-gray-100 pt-4">
              {orderHistory.slice(0, 3).map((order) => (
                <div key={order.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200"><p className="text-xs text-gray-500 mb-1">{order.date}</p><div className="flex justify-between items-end"><p className="text-sm font-bold text-red-600">¥{order.total.toLocaleString()}</p><p className="text-xs text-gray-500">{order.items.length}点</p></div></div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}