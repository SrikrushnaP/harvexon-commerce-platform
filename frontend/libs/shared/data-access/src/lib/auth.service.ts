import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, ApiResponse } from './api.service';
import { tap, catchError, of } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  private _user = signal<User | null>(null);
  private _token = signal<string | null>(null);

  user = this._user.asReadonly();
  token = this._token.asReadonly();
  isAuthenticated = computed(() => !!this._token());
  userRole = computed(() => this._user()?.role || '');

  constructor() {
    this.loadFromStorage();
  }

  login(email: string, password: string) {
    return this.api.post<LoginResponse>('/auth/login', { email, password }).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.setSession(res.data);
        }
      })
    );
  }

  logout() {
    const refreshToken = localStorage.getItem('hcp_refresh_token');
    this.api.post('/auth/logout', { refreshToken }).pipe(
      catchError(() => of(null))
    ).subscribe();
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getProfile() {
    return this.api.get<{ user: User }>('/auth/profile');
  }

  getToken(): string | null {
    return this._token();
  }

  private setSession(data: LoginResponse) {
    this._user.set(data.user);
    this._token.set(data.tokens.accessToken);
    localStorage.setItem('hcp_token', data.tokens.accessToken);
    localStorage.setItem('hcp_refresh_token', data.tokens.refreshToken);
    localStorage.setItem('hcp_user', JSON.stringify(data.user));
  }

  private clearSession() {
    this._user.set(null);
    this._token.set(null);
    localStorage.removeItem('hcp_token');
    localStorage.removeItem('hcp_refresh_token');
    localStorage.removeItem('hcp_user');
  }

  private loadFromStorage() {
    const token = localStorage.getItem('hcp_token');
    const userStr = localStorage.getItem('hcp_user');
    if (token && userStr) {
      try {
        this._user.set(JSON.parse(userStr));
        this._token.set(token);
      } catch {
        this.clearSession();
      }
    }
  }
}
