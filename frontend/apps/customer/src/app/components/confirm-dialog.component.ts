import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (open()) {
      <div class="overlay" (click)="onCancel()">
        <div class="dialog" (click)="$event.stopPropagation()">
          <div class="dialog-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4M12 16h.01"/>
            </svg>
          </div>
          <h3 class="dialog-title">{{ title() }}</h3>
          <p class="dialog-message">{{ message() }}</p>
          <div class="dialog-actions">
            <button class="btn-cancel" (click)="onCancel()">Cancel</button>
            <button class="btn-confirm" (click)="onConfirm()">{{ confirmText() }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.4); backdrop-filter: blur(2px);
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn 0.15s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(12px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .dialog {
      background: #fff; border-radius: 16px; padding: 28px 24px 20px;
      width: 90%; max-width: 340px; text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      animation: slideUp 0.2s ease;
    }
    .dialog-icon { margin-bottom: 12px; }
    .dialog-title { font-size: 1.1rem; font-weight: 600; color: #1f2937; margin: 0 0 8px; }
    .dialog-message { font-size: 0.9rem; color: #6b7280; margin: 0 0 20px; line-height: 1.4; }
    .dialog-actions { display: flex; gap: 10px; }
    .btn-cancel, .btn-confirm {
      flex: 1; padding: 10px 16px; border-radius: 10px; border: none;
      font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: all 0.15s;
    }
    .btn-cancel { background: #f3f4f6; color: #374151; }
    .btn-cancel:hover { background: #e5e7eb; }
    .btn-confirm { background: #dc2626; color: #fff; }
    .btn-confirm:hover { background: #b91c1c; }
  `
})
export class ConfirmDialogComponent {
  open = input<boolean>(false);
  title = input<string>('Are you sure?');
  message = input<string>('This action cannot be undone.');
  confirmText = input<string>('Delete');

  confirmed = output<void>();
  cancelled = output<void>();

  onConfirm() {
    this.confirmed.emit();
  }

  onCancel() {
    this.cancelled.emit();
  }
}
