export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
}

let products: Product[] = [
  { id: 1, name: 'Pizza', price: 10, description: 'Delicious pizza' },
  { id: 2, name: 'Burger', price: 5, description: 'Tasty burger' },
];

export { products };
