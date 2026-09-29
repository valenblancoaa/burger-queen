import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Subscription, interval, startWith, switchMap } from 'rxjs';

import { OrdersService } from '../../../core/services/orders.service';
import { Order } from '../../../core/models/order.model';
import { formatTime } from '../../../shared/utils/time';

const REFRESH_MS = 15_000;

@Component({
  selector: 'app-ready-orders',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './ready-orders.component.html',
  styleUrl: './ready-orders.component.css',
})
export class ReadyOrdersComponent implements OnInit, OnDestroy {
  private ordersService = inject(OrdersService);
  private refresh?: Subscription;

  orders = signal<Order[]>([]);
  loading = signal(true);
  error = '';
  updatingId: number | null = null;
  showDelivered = signal(false);

  /** Listos para servir, el que lleva más tiempo esperando primero. */
  ready = computed(() =>
    this.orders()
      .filter((o) => o.status === 'delivering')
      .sort((a, b) => (a.dateProcessed ?? '').localeCompare(b.dateProcessed ?? '')),
  );

  /** Entregados, más recientes primero. Se conservan para estadísticas. */
  delivered = computed(() =>
    this.orders()
      .filter((o) => o.status === 'delivered')
      .sort((a, b) => b.dateEntry.localeCompare(a.dateEntry)),
  );

  ngOnInit(): void {
    this.refresh = interval(REFRESH_MS)
      .pipe(
        startWith(0),
        switchMap(() => this.ordersService.getAll()),
      )
      .subscribe({
        next: (orders) => {
          this.orders.set(orders);
          this.loading.set(false);
          this.error = '';
        },
        error: () => {
          this.loading.set(false);
          this.error = 'No se pudieron cargar los pedidos.';
        },
      });
  }

  ngOnDestroy(): void {
    this.refresh?.unsubscribe();
  }

  markDelivered(order: Order): void {
    this.updatingId = order.id;
    this.ordersService.updateStatus(order.id, 'delivered').subscribe({
      next: (updated) => {
        this.orders.update((list) => list.map((o) => (o.id === updated.id ? updated : o)));
        this.updatingId = null;
      },
      error: () => {
        this.updatingId = null;
        this.error = `No se pudo marcar el pedido #${order.id} como entregado.`;
      },
    });
  }

  total(order: Order): number {
    return order.products.reduce((sum, i) => sum + i.qty * i.product.price, 0);
  }

  time(iso: string | undefined): string {
    return iso ? formatTime(iso) : '—';
  }

  toggleDelivered(): void {
    this.showDelivered.update((v) => !v);
  }
}
