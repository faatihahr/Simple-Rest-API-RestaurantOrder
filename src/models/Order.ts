import type { Product } from './Product.ts';

export interface OrderItem {
  productId: number;
  quantity: number;
  name: string;
}

export interface Order {
  id: number;
  items: OrderItem[];
  total: number;
}

let orders: Order[] = [
  {
    id: 1,
    items: [
      { productId: 1, quantity: 2, name: 'Pizza' },
      { productId: 2, quantity: 1, name: 'Burger' }
    ],
    total: 25 
  },
  {
    id: 2,
    items: [
      { productId: 2, quantity: 3, name: 'Burger' }
    ],
    total: 15 
  }
];

export { orders };
