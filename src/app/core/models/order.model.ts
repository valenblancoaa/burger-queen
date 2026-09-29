import { Product } from './product.model';

/**
 * pending     -> recién enviado a cocina
 * delivering  -> cocina lo marcó como listo, esperando que se sirva
 * delivered   -> entregado a la mesa
 */
export type OrderStatus = 'pending' | 'delivering' | 'delivered' | 'canceled';

export interface OrderItem {
  qty: number;
  product: Product;
}

export interface Order {
  id: number;
  userId: number;
  client: string;
  products: OrderItem[];
  status: OrderStatus;
  dateEntry: string;
  dateProcessed?: string;
}

export type NewOrder = Omit<Order, 'id'>;

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'En cocina',
  delivering: 'Listo para servir',
  delivered: 'Entregado',
  canceled: 'Cancelado',
};
