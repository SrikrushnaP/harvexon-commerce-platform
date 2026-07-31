import { Component, inject, signal } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '@frontend/shared-data-access';
import { AddressService } from '../../services/address.service';

@Component({
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <h1 class="auth-title">Welcome Back</h1>
        <p class="auth-subtitle">Sign in to your account</p>

        @if (error()) {
          <div class="error-message">{{ error() }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input id="email" type="email" formControlName="email"
              class="form-input" placeholder="Enter your email" autocomplete="email" />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input id="password" type="password" formControlName="password"
              class="form-input" placeholder="Enter your password" autocomplete="current-password" />
          </div>

          <button type="submit" class="submit-btn" [disabled]="loading() || form.invalid">
            {{ loading() ? 'Signing in...' : 'Sign In →' }}
          </button>
        </form>

        <p class="auth-footer">
          Don't have an account?
          <a routerLink="/register" class="auth-link">Create one</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8faf8;
      padding: 24px 16px;
    }
    .auth-card {
      width: 100%;
      max-width: 400px;
      background: white;
      border-radius: 20px;
      padding: 40px 32px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      text-align: center;
    }
    .auth-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #16a34a, #15803d);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      color: white;
      box-shadow: 0 4px 14px rgba(22, 163, 74, 0.3);
    }
    .auth-title {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0 0 6px;
    }
    .auth-subtitle {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 28px;
    }
    .error-message {
      background: #fef2f2;
      border-left: 3px solid #dc2626;
      color: #dc2626;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 13px;
      text-align: left;
      margin-bottom: 20px;
    }
    .form-group {
      margin-bottom: 18px;
      text-align: left;
    }
    .form-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 6px;
    }
    .form-input {
      width: 100%;
      height: 48px;
      border: 1.5px solid #e5e7eb;
      border-radius: 12px;
      padding: 0 16px;
      font-size: 15px;
      color: #1f2937;
      background: #fafafa;
      transition: all 0.2s ease;
      box-sizing: border-box;
      outline: none;
    }
    .form-input:focus {
      border-color: #16a34a;
      box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
      background: white;
    }
    .form-input::placeholder {
      color: #9ca3af;
    }
    .submit-btn {
      width: 100%;
      height: 48px;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, #16a34a, #15803d);
      color: white;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 8px;
      box-shadow: 0 4px 14px rgba(22, 163, 74, 0.25);
    }
    .submit-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(22, 163, 74, 0.35);
    }
    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .auth-footer {
      margin-top: 24px;
      font-size: 14px;
      color: #6b7280;
    }
    .auth-link {
      color: #16a34a;
      font-weight: 600;
      text-decoration: none;
    }
    .auth-link:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private addressService = inject(AddressService);
  auth = inject(AuthService);

  loading = signal(false);
  error = signal('');

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set('');

    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe({
      next: () => {
        this.loading.set(false);
        // Merge any guest addresses saved in localStorage to the user's account
        this.addressService.mergeGuestAddresses();
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Login failed. Please try again.');
      }
    });
  }
}
