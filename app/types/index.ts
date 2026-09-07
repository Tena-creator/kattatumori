// app/types/index.ts
export type Item = {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  reviews: number;
  delivery: string;
  shopName: string;
  description: string;
  url: string;
};

export type Order = {
  id: string;
  date: string;
  items: Item[];
  total: number;
  payMethod: string;
};

export type ViewState = "SHOP" | "DETAIL" | "CART" | "ADDRESS" | "PAYMENT" | "CONFIRM" | "LOADING" | "RESULT" | "MYPAGE" | "HOWTO" | "PRIVACY" | "TERMS" | "CONTACT";