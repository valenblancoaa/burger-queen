import { inject } from '@angular/core';
import { Routes } from '@angular/router';

import { AuthService } from './core/services/auth.service';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { LayoutComponent } from './shared/layout/layout.component';
import { LoginComponent } from './features/login/login.component';
import { NewOrderComponent } from './features/waiter/new-order/new-order.component';
import { ReadyOrdersComponent } from './features/waiter/ready-orders/ready-orders.component';
import { KitchenComponent } from './features/kitchen/kitchen.component';
import { UsersAdminComponent } from './features/admin/users/users-admin.component';
import { ProductsAdminComponent } from './features/admin/products/products-admin.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      // La pantalla inicial depende del rol de quien ingresa
      { path: '', pathMatch: 'full', redirectTo: () => inject(AuthService).homeRoute() },
      {
        path: 'pedidos/nuevo',
        component: NewOrderComponent,
        canActivate: [roleGuard],
        data: { roles: ['waiter', 'admin'] },
      },
      {
        path: 'pedidos/listos',
        component: ReadyOrdersComponent,
        canActivate: [roleGuard],
        data: { roles: ['waiter', 'admin'] },
      },
      {
        path: 'cocina',
        component: KitchenComponent,
        canActivate: [roleGuard],
        data: { roles: ['chef', 'admin'] },
      },
      {
        path: 'admin/trabajadores',
        component: UsersAdminComponent,
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
      },
      {
        path: 'admin/productos',
        component: ProductsAdminComponent,
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
