"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Lock, TrendingUp, Users, ShoppingCart, DollarSign, Activity, Globe } from "lucide-react";
import { APP_CONFIG } from "../config/app";

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalUsers: 0,
    recentOrders: [] as any[]
  });
  const [isLoading, setIsLoading] = useState(false);

  // ▼ ここをお好きなパスワードに変更してください！
  const SECRET_PASSWORD = "kattatsumori2026";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SECRET_PASSWORD) {
      setIsAuthenticated(true);
      fetchData();
    } else {
      setError("パスワードが違います");
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 全ユーザー数 (Profiles)
      const { count: usersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      
      // 全注文の金額と日時
      const { data: orders } = await supabase.from("orders").select("total_amount, created_at").order('created_at', { ascending: false });
      
      let totalSales = 0;
      let totalOrders = orders?.length || 0;
      
      if (orders) {
        totalSales = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
      }

      setStats({
        totalSales,
        totalOrders,
        totalUsers: usersCount || 0,
        recentOrders: orders ? orders.slice(0, 15) : [] // 最新15件
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full space-y-6">
          <div className="flex justify-center"><Lock className="w-12 h-12 text-gray-300" /></div>
          <h1 className="text-2xl font-black text-center text-gray-900">管理者ダッシュボード</h1>
          <div>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="シークレットパスワードを入力" 
              className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 outline-none focus:border-red-500 transition" 
            />
          </div>
          {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}
          <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition active:scale-95 shadow-md">
            ログイン
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200 gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">カッタツモリ リアルタイム戦況</h1>
            <p className="text-sm text-gray-500 mt-1">みんなのドーパミン放出状況を監視中👀</p>
          </div>
          <button onClick={fetchData} className="px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm active:scale-95 w-full md:w-auto">
            <Activity className="w-5 h-5" /> 最新データを取得
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 font-bold tracking-widest">データベースに接続中...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-2"><Globe className="w-5 h-5 text-gray-400" /><h3 className="text-xs font-bold text-gray-500">全世界累計妄想売上</h3></div>
                <p className="text-3xl font-black text-gray-900">¥{(APP_CONFIG.globalBaseSales + stats.totalSales).toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 mt-2">※初期値（{APP_CONFIG.globalBaseSales.toLocaleString()}）込み</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-2"><DollarSign className="w-5 h-5 text-red-500" /><h3 className="text-xs font-bold text-gray-500">純・アプリ内妄想売上</h3></div>
                <p className="text-3xl font-black text-red-600">¥{stats.totalSales.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 mt-2">ユーザーが実際に決済した総額</p>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-2"><ShoppingCart className="w-5 h-5 text-blue-500" /><h3 className="text-xs font-bold text-gray-500">総妄想注文件数</h3></div>
                <p className="text-3xl font-black text-gray-900">{stats.totalOrders.toLocaleString()} <span className="text-base font-medium text-gray-500">件</span></p>
                <p className="text-[10px] text-gray-400 mt-2">カート決済された回数</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-2"><Users className="w-5 h-5 text-emerald-500" /><h3 className="text-xs font-bold text-gray-500">累計訪問ユーザー数</h3></div>
                <p className="text-3xl font-black text-gray-900">{stats.totalUsers.toLocaleString()} <span className="text-base font-medium text-gray-500">人</span></p>
                <p className="text-[10px] text-gray-400 mt-2">一度でもサイトを開いた端末数</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mt-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><TrendingUp className="w-6 h-6 text-red-500" /> 最新の妄想決済ログ</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-500 border-y border-gray-200">
                    <tr>
                      <th className="px-4 py-4 font-bold">決済日時</th>
                      <th className="px-4 py-4 font-bold">妄想決済金額</th>
                      <th className="px-4 py-4 font-bold text-center">ステータス</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.recentOrders.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-12 text-center text-gray-400 font-bold">まだ注文データがありません。Xでの拡散を待ちましょう！</td></tr>
                    ) : (
                      stats.recentOrders.map((order, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-4">{new Date(order.created_at).toLocaleString('ja-JP')}</td>
                          <td className="px-4 py-4 font-black text-gray-900 text-lg">¥{Number(order.total_amount).toLocaleString()}</td>
                          <td className="px-4 py-4 text-center">
                            <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold">妄想完了</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}