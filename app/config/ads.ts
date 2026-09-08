export const AD_BANNERS = [
  { 
    id: 1, 
    isActive: false, // ← trueで表示、falseで非表示（ON/OFF）
    label: "キャンペーン", 
    title: "楽天スーパーSALE 開催中！", 
    subtitle: "ショップ買いまわりでポイント最大47.5倍", 
    bgClass: "bg-gradient-to-r from-red-600 to-red-800",
    imageUrl: "", // 画像バナーにする場合はここにURLを入れる（例: "https://..."）
    link: ""      // タップした時の飛び先アフィリエイトリンク
  },
  { 
    id: 2, 
    isActive: false, // ← false なのでこのバナーはお休み中（表示されません）
    label: "タイアップ", 
    title: "最新スマート家電特集", 
    subtitle: "生活を豊かにするアイテムが勢揃い", 
    bgClass: "bg-gradient-to-r from-blue-600 to-indigo-600",
    imageUrl: "",
    link: ""
  },
  { 
    id: 3, 
    isActive: false, 
    label: "タイムセール", 
    title: "高級ブランド時計 抽選会", 
    subtitle: "憧れのあの時計が手に入るチャンス", 
    bgClass: "bg-gradient-to-r from-yellow-600 to-yellow-800",
    imageUrl: "",
    link: ""
  },
  // ▼ 画像バナーを使う場合の設定例（参考用）
  { 
    id: 4, 
    isActive: false, // テスト時は true にしてみてください
    label: "", title: "", subtitle: "", bgClass: "",
    imageUrl: "https://placehold.co/600x200/emerald/white?text=Affiliate+Banner",
    link: "https://a.r10.to/xxxxxx"
  }
];