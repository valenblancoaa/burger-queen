import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProductsService } from '../../../core/services/products.service';
import { OrdersService } from '../../../core/services/orders.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  MENU_LABEL,
  Menu,
  PRODUCT_TYPE_LABEL,
  Product,
  belongsToMenu,
} from '../../../core/models/product.model';
import { OrderItem } from '../../../core/models/order.model';

@Component({
  selector: 'app-new-order',
  standalone: true,
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './new-order.component.html',
  styleUrl: './new-order.component.css',
})
export class NewOrderComponent implements OnInit {
  private productsService = inject(ProductsService);
  private ordersService = inject(OrdersService);
  private auth = inject(AuthService);

  readonly menus: Menu[] = ['breakfast', 'allday'];
  readonly menuLabel = MENU_LABEL;
  readonly typeLabel = PRODUCT_TYPE_LABEL;

  products = signal<Product[]>([]);
  activeMenu = signal<Menu>('allday');
  loading = signal(true);
  loadError = '';

  client = '';
  items = signal<OrderItem[]>([]);
  sending = false;
  sentMessage = '';
  sendError = '';

  visibleProducts = computed(() =>
    this.products().filter((p) => belongsToMenu(p, this.activeMenu())),
  );
  total = computed(() =>
    this.items().reduce((sum, item) => sum + item.qty * item.product.price, 0),
  );
  itemCount = computed(() => this.items().reduce((sum, i) => sum + i.qty, 0));

  ngOnInit(): void {
    this.productsService.getAll().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => {
        this.loadError = 'No se pudo cargar el menú. Revisa la conexión con la API.';
        this.loading.set(false);
      },
    });
  }

  selectMenu(menu: Menu): void {
    this.activeMenu.set(menu);
  }

  add(product: Product): void {
    this.sentMessage = '';
    this.items.update((items) => {
      const existing = items.find((i) => i.product.id === product.id);
      if (existing) {
        return items.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [...items, { qty: 1, product }];
    });
  }

  decrease(product: Product): void {
    this.items.update((items) =>
      items
        .map((i) => (i.product.id === product.id ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0),
    );
  }

  remove(product: Product): void {
    this.items.update((items) => items.filter((i) => i.product.id !== product.id));
  }

  qtyOf(product: Product): number {
    return this.items().find((i) => i.product.id === product.id)?.qty ?? 0;
  }

  get canSend(): boolean {
    return this.client.trim().length > 0 && this.items().length > 0 && !this.sending;
  }

  send(): void {
    if (!this.canSend) return;
    const user = this.auth.currentUser();
    if (!user) return;

    this.sending = true;
    this.sendError = '';

    this.ordersService
      .create({
        userId: user.id,
        client: this.client.trim(),
        products: this.items(),
        status: 'pending',
        dateEntry: new Date().toISOString(),
      })
      .subscribe({
        next: (order) => {
          this.sending = false;
          this.sentMessage = `Pedido #${order.id} de ${order.client} enviado a cocina.`;
          this.client = '';
          this.items.set([]);
        },
        error: () => {
          this.sending = false;
          this.sendError = 'No se pudo enviar el pedido. Intenta de nuevo.';
        },
      });
  }
}
