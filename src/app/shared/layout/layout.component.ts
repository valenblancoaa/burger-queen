import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { ROLE_LABEL, Role } from '../../core/models/user.model';

interface NavLink {
  label: string;
  path: string;
  roles: Role[];
}

const NAV_LINKS: NavLink[] = [
  { label: 'Nuevo pedido', path: '/pedidos/nuevo', roles: ['waiter', 'admin'] },
  { label: 'Listos para servir', path: '/pedidos/listos', roles: ['waiter', 'admin'] },
  { label: 'Cocina', path: '/cocina', roles: ['chef', 'admin'] },
  { label: 'Trabajadores', path: '/admin/trabajadores', roles: ['admin'] },
  { label: 'Productos', path: '/admin/productos', roles: ['admin'] },
];

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent {
  auth = inject(AuthService);

  user = this.auth.currentUser;
  roleLabel = computed(() => {
    const role = this.user()?.role;
    return role ? ROLE_LABEL[role] : '';
  });
  links = computed(() => {
    const role = this.user()?.role;
    return role ? NAV_LINKS.filter((l) => l.roles.includes(role)) : [];
  });

  logout(): void {
    this.auth.logout();
  }
}
