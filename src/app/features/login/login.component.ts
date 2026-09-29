import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  loading = false;
  serverError = '';

  constructor() {
    if (this.auth.isLoggedIn()) {
      this.router.navigateByUrl(this.auth.homeRoute());
    }
  }

  showError(field: 'email' | 'password'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  get emailError(): string {
    const control = this.form.controls.email;
    if (control.hasError('required')) return 'Escribe tu correo.';
    if (control.hasError('email')) return 'Ese correo no tiene un formato válido.';
    return '';
  }

  submit(): void {
    this.serverError = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe({
      next: () => this.router.navigateByUrl(this.auth.homeRoute()),
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.serverError = this.messageFor(err);
      },
    });
  }

  /** Traduce la respuesta del servidor a un mensaje entendible. */
  private messageFor(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor. Revisa que la API esté encendida.';
    }
    const body = typeof err.error === 'string' ? err.error : err.error?.message ?? '';
    if (/cannot find user/i.test(body)) {
      return 'No existe una cuenta con ese correo.';
    }
    if (/incorrect password|password is too short/i.test(body)) {
      return 'La contraseña es incorrecta.';
    }
    if (err.status === 400 || err.status === 401 || err.status === 404) {
      return 'Correo o contraseña incorrectos.';
    }
    return 'Ocurrió un error inesperado. Intenta de nuevo.';
  }
}
