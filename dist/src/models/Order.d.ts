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
declare let orders: Order[];
export { orders };
//# sourceMappingURL=Order.d.ts.map