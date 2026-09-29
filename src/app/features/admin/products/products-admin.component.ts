import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ProductsService } from '../../../core/services/products.service';
import {
  PRODUCT_TYPES,
  PRODUCT_TYPE_LABEL,
  Product,
  ProductType,
} from '../../../core/models/product.model';

@Component({
  selector: 'app-products-admin',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './products-admin.component.html',
  styleUrl: './products-admin.component.css',
})
export class ProductsAdminComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productsService = inject(ProductsService);

  readonly types = PRODUCT_TYPES;
  readonly typeLabel = PRODUCT_TYPE_LABEL;

  products = signal<Product[]>([]);
  loading = signal(true);
  editing = signal<Product | null>(null);
  saving = false;
  message = '';
  error = '';

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    price: [0, [Validators.required, Validators.min(0.01)]],
    image: [''],
    type: ['Lunch' as ProductType, [Validators.required]],
  });

  ngOnInit(): void {
    this.productsService.getAll().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error = 'No se pudo cargar la lista de productos.';
      },
    });
  }

  startEdit(product: Product): void {
    this.editing.set(product);
    this.message = '';
    this.form.reset({
      name: product.name,
      price: product.price,
      image: product.image ?? '',
      type: product.type,
    });
  }

  cancelEdit(): void {
    this.editing.set(null);
    this.form.reset({ name: '', price: 0, image: '', type: 'Lunch' });
  }

  showError(field: 'name' | 'price' | 'type'): boolean {
    const c = this.form.controls[field];
    return c.invalid && (c.touched || c.dirty);
  }

  save(): void {
    this.message = '';
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const value = this.form.getRawValue();
    const current = this.editing();

    if (current) {
      this.productsService.update(current.id, value).subscribe({
        next: (updated) => {
          this.products.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
          this.message = `"${updated.name}" actualizado.`;
          this.saving = false;
          this.cancelEdit();
        },
        error: () => this.fail('No se pudo actualizar el producto.'),
      });
    } else {
      this.productsService
        .create({ ...value, dateEntry: new Date().toISOString() })
        .subscribe({
          next: (created) => {
            this.products.update((list) => [...list, created]);
            this.message = `"${created.name}" agregado en ${PRODUCT_TYPE_LABEL[created.type]}.`;
            this.saving = false;
            this.cancelEdit();
          },
          error: () => this.fail('No se pudo agregar el producto.'),
        });
    }
  }

  remove(product: Product): void {
    const ok = window.confirm(`¿Eliminar "${product.name}" del menú?`);
    if (!ok) return;

    this.productsService.delete(product.id).subscribe({
      next: () => {
        this.products.update((list) => list.filter((p) => p.id !== product.id));
        this.message = `"${product.name}" eliminado.`;
        if (this.editing()?.id === product.id) this.cancelEdit();
      },
      error: () => (this.error = 'No se pudo eliminar. Intenta de nuevo.'),
    });
  }

  private fail(msg: string): void {
    this.saving = false;
    this.error = msg;
  }
}
