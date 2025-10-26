// src/types.ts
export interface User {
  id: number;
  username: string;
  is_admin: boolean;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  quantity?: number;      // current stock (optional because some endpoints may not include)
  image_url?: string | null; // relative URL to /static/uploads/... (optional)
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  product_id: number;
  quantity: number;
}

export interface OrderResponse {
  order_code: string;
}

export interface OrderDetailItem {
  product_name: string;
  quantity: number;
  price?: number;   // snapshot unit price when available
  subtotal?: number; // snapshot subtotal when available
}

export interface OrderDetail {
  code: string;
  items: OrderDetailItem[];
  total: number;
  collected?: boolean; // explicit boolean flag
  created_at?: string;
  user?: {
    id: number;
    username: string;
  } | null;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
