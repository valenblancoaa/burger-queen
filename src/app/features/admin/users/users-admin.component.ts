import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { UsersService } from '../../../core/services/users.service';
import { AuthService } from '../../../core/services/auth.service';
import { ROLE_LABEL, Role, User } from '../../../core/models/user.model';

@Component({
  selector: 'app-users-admin',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './users-admin.component.html',
  styleUrl: './users-admin.component.css',
})
export class UsersAdminComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usersService = inject(UsersService);
  private auth = inject(AuthService);

  readonly roles: Role[] = ['waiter', 'chef', 'admin'];
  readonly roleLabel = ROLE_LABEL;

  users = signal<User[]>([]);
  loading = signal(true);
  editing = signal<User | null>(null);
  saving = false;
  message = '';
  error = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['waiter' as Role, [Validators.required]],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.usersService.getAll().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error = 'No se pudo cargar la lista de trabajadores.';
      },
    });
  }

  isMe(user: User): boolean {
    return this.auth.currentUser()?.id === user.id;
  }

  startEdit(user: User): void {
    this.editing.set(user);
    this.message = '';
    this.form.reset({ email: user.email, password: '', role: user.role });
    // Al editar, la contraseña es opcional (solo se cambia si se escribe una nueva).
    this.form.controls.password.setValidators([Validators.minLength(6)]);
    this.form.controls.password.updateValueAndValidity();
  }

  cancelEdit(): void {
    this.editing.set(null);
    this.form.reset({ email: '', password: '', role: 'waiter' });
    this.form.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.controls.password.updateValueAndValidity();
  }

  showError(field: 'email' | 'password' | 'role'): boolean {
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
      const changes: Partial<User> = { email: value.email, role: value.role };
      if (value.password) changes.password = value.password;

      this.usersService.update(current.id, changes).subscribe({
        next: (updated) => {
          this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
          this.message = `Datos de ${updated.email} actualizados.`;
          this.saving = false;
          this.cancelEdit();
        },
        error: () => this.fail('No se pudo actualizar. Revisa los datos e intenta de nuevo.'),
      });
    } else {
      this.usersService.create(value).subscribe({
        next: (created) => {
          this.users.update((list) => [...list, created]);
          this.message = `${created.email} agregado/a como ${ROLE_LABEL[created.role]}.`;
          this.saving = false;
          this.cancelEdit();
        },
        error: (err) => {
          const body = typeof err?.error === 'string' ? err.error : err?.error?.message ?? '';
          this.fail(
            /already exists/i.test(body)
              ? 'Ya existe una cuenta con ese correo.'
              : 'No se pudo agregar. Revisa los datos e intenta de nuevo.',
          );
        },
      });
    }
  }

  remove(user: User): void {
    if (this.isMe(user)) return;
    const ok = window.confirm(`¿Eliminar a ${user.email}? Esta acción no se puede deshacer.`);
    if (!ok) return;

    this.usersService.delete(user.id).subscribe({
      next: () => {
        this.users.update((list) => list.filter((u) => u.id !== user.id));
        this.message = `${user.email} eliminado/a.`;
        if (this.editing()?.id === user.id) this.cancelEdit();
      },
      error: () => (this.error = 'No se pudo eliminar. Intenta de nuevo.'),
    });
  }

  private fail(msg: string): void {
    this.saving = false;
    this.error = msg;
  }
}
