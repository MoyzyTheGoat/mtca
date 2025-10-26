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

export interface OrderDetail {
  code: string;
  items: {
    product_name: string;
    quantity: number;
    price?: number;
    subtotal?: number;
  }[];
  total: number;
  collected?: boolean; // explicit boolean
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
