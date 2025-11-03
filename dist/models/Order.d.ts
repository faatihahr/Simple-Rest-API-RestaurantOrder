export interface OrderItem {
    productId: number;
    quantity: number;
}
export interface Order {
    id: number;
    items: OrderItem[];
    total: number;
}
declare let orders: Order[];
export { orders };
//# sourceMappingURL=Order.d.ts.map