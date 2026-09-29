import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { NewOrder, Order, OrderStatus } from '../models/order.model';

/** Algunas órdenes de ejemplo de la API traen "dataEntry" en vez de "dateEntry". */
type RawOrder = Order & { dataEntry?: string };

function normalize(order: RawOrder): Order {
  const { dataEntry, ...rest } = order;
  return { ...rest, dateEntry: order.dateEntry ?? dataEntry ?? '' };
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/orders`;

  getAll(): Observable<Order[]> {
    return this.http.get<RawOrder[]>(this.url).pipe(map((orders) => orders.map(normalize)));
  }

  create(order: NewOrder): Observable<Order> {
    return this.http.post<Order>(this.url, order);
  }

  /** Cambia el estado. Al marcar como listo guarda la hora en que se terminó de preparar. */
  updateStatus(id: number, status: OrderStatus): Observable<Order> {
    const changes: Partial<Order> = { status };
    if (status === 'delivering') {
      changes.dateProcessed = new Date().toISOString();
    }
    return this.http.patch<Order>(`${this.url}/${id}`, changes);
  }
}
