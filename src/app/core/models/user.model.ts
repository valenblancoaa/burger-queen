export type Role = 'admin' | 'waiter' | 'chef';

export interface User {
  id: number;
  email: string;
  role: Role;
  password?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador/a',
  waiter: 'Mesero/a',
  chef: 'Cocina',
};
