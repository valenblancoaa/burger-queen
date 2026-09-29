import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Subscription, interval, startWith, switchMap } from 'rxjs';

import { OrdersService } from '../../core/services/orders.service';
import { Order } from '../../core/models/order.model';
import { formatDuration, formatTime } from '../../shared/utils/time';

const REFRESH_MS = 15_000;

@Component({
  selector: 'app-kitchen',
  standalone: true,
  templateUrl: './kitchen.component.html',
  styleUrl: './kitchen.component.css',
})
export class KitchenComponent implements OnInit, OnDestroy {
  private ordersService = inject(OrdersService);
  private refresh?: Subscription;
  private clock?: ReturnType<typeof setInterval>;

  orders = signal<Order[]>([]);
  now = signal(Date.now());
  loading = signal(true);
  error = '';
  updatingId: number | null = null;

  /** Pendientes, del más antiguo al más reciente (orden de llegada). */
  pending = computed(() =>
    this.orders()
      .filter((o) => o.status === 'pending')
      .sort((a, b) => a.dateEntry.localeCompare(b.dateEntry)),
  );

  /** Ya preparados, los más recientes primero. */
  done = computed(() =>
    this.orders()
      .filter((o) => o.status === 'delivering' || o.status === 'delivered')
      .sort((a, b) => (b.dateProcessed ?? '').localeCompare(a.dateProcessed ?? '')),
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

    // Actualiza el "tiempo esperando" sin pedir datos al servidor.
    this.clock = setInterval(() => this.now.set(Date.now()), 10_000);
  }

  ngOnDestroy(): void {
    this.refresh?.unsubscribe();
    if (this.clock) clearInterval(this.clock);
  }

  markReady(order: Order): void {
    this.updatingId = order.id;
    this.ordersService.updateStatus(order.id, 'delivering').subscribe({
      next: (updated) => {
        this.orders.update((list) => list.map((o) => (o.id === updated.id ? updated : o)));
        this.updatingId = null;
      },
      error: () => {
        this.updatingId = null;
        this.error = `No se pudo marcar el pedido #${order.id} como listo.`;
      },
    });
  }

  waitingTime(order: Order): string {
    return formatDuration(order.dateEntry, this.now());
  }

  prepTime(order: Order): string {
    return order.dateProcessed ? formatDuration(order.dateEntry, order.dateProcessed) : '—';
  }

  time(iso: string | undefined): string {
    return iso ? formatTime(iso) : '—';
  }
}
