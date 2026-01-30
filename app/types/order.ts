export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
  subtotal: number;
};

export type Order = {
  id: string;
  buyerName: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdBy: string;
  createdAt: Date | null;
};
