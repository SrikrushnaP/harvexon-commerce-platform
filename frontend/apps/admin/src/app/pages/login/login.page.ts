import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@frontend/shared-data-access';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1>HCP Admin</h1>
        <p class="subtitle">Sign in to manage your business</p>

        @if (error()) {
          <div class="error">{{ error() }}</div>
        }

        <form (ngSubmit)="onSubmit()">
          <div class="field">
            <label for="email">Email</label>
            <input id="email" type="email" [(ngModel)]="email" name="email"
                   placeholder="admin@hrfressh.com" required />
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input id="password" type="password" [(ngModel)]="password" name="password"
                   placeholder="••••••••" required />
          </div>
          <button type="submit" [disabled]="loading()">
            {{ loading() ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: linear-gradient(135deg, #1e293b, #0f172a);
    }
    .login-card {
      background: #fff;
      padding: 3rem;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      width: 100%;
      max-width: 400px;
      h1 { margin: 0 0 0.5rem; color: #1e293b; }
      .subtitle { color: #64748b; margin: 0 0 2rem; }
    }
    .field {
      margin-bottom: 1.25rem;
      label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #334155; }
      input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 1rem;
        box-sizing: border-box;
        &:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
      }
    }
    button {
      width: 100%;
      padding: 0.875rem;
      background: #3b82f6;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      &:hover:not(:disabled) { background: #2563eb; }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
    .error {
      background: #fef2f2;
      color: #dc2626;
      padding: 0.75rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }
  `],
})
export class LoginPage {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  onSubmit() {
    this.loading.set(true);
    this.error.set('');

    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.error.set(res.message || 'Login failed');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Connection failed');
      },
    });
  }
}
