import { Component, inject, signal } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ApiService } from '@frontend/shared-data-access';

@Component({
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
        </div>

        <h1 class="auth-title">Create Account</h1>
        <p class="auth-subtitle">Join HrFressh today</p>

        @if (error()) {
          <div class="error-message">{{ error() }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" for="name">Full Name</label>
            <input id="name" type="text" formControlName="name"
              class="form-input" placeholder="Enter your full name" autocomplete="name" />
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input id="email" type="email" formControlName="email"
              class="form-input" placeholder="Enter your email" autocomplete="email" />
          </div>

          <div class="form-group">
            <label class="form-label" for="phone">Phone</label>
            <input id="phone" type="tel" formControlName="phone"
              class="form-input" placeholder="Enter your phone number" autocomplete="tel" />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input id="password" type="password" formControlName="password"
              class="form-input" placeholder="Create a password" autocomplete="new-password" />
          </div>

          <div class="form-group">
            <label class="form-label" for="confirmPassword">Confirm Password</label>
            <input id="confirmPassword" type="password" formControlName="confirmPassword"
              class="form-input" placeholder="Confirm your password" autocomplete="new-password" />
          </div>

          @if (form.hasError('passwordMismatch') && form.get('confirmPassword')?.touched) {
            <div class="field-error">Passwords do not match</div>
          }

          <button type="submit" class="submit-btn" [disabled]="loading() || form.invalid">
            {{ loading() ? 'Creating account...' : 'Create Account →' }}
          </button>
        </form>

        <p class="auth-footer">
          Already have an account?
          <a routerLink="/login" class="auth-link">Sign In</a>
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
    .field-error {
      color: #dc2626;
      font-size: 12px;
      text-align: left;
      margin: -10px 0 16px;
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
export class RegisterPage {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private api = inject(ApiService);

  loading = signal(false);
  error = signal('');

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: [this.passwordMatchValidator] });

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set('');

    const { name, email, phone, password } = this.form.getRawValue();

    this.api.post('/auth/register', { name, email, phone, password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Registration failed. Please try again.');
      }
    });
  }
}
