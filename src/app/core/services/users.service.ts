import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/users`;

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.url);
  }

  /** La API responde con { accessToken, user } al crear; nos quedamos solo con el usuario. */
  create(user: Omit<User, 'id'>): Observable<User> {
    return this.http
      .post<User | { accessToken: string; user: User }>(this.url, user)
      .pipe(map((res) => ('user' in res ? res.user : res)));
  }

  update(id: number, changes: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.url}/${id}`, changes);
  }

  delete(id: number): Observable<unknown> {
    return this.http.delete(`${this.url}/${id}`);
  }
}
