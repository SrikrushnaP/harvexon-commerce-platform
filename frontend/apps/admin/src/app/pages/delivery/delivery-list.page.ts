import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@frontend/shared-data-access';

interface Assignment {
  id: string;
  order: {
    orderNumber: string;
    customer: { name: string };
    deliveryAddress: string;
    total: number;
  };
  deliveryStaff: {
    id: string;
    name: string;
    phone: string;
  };
  status: string;
  assignedAt: string;
  deliveredAt: string | null;
  notes?: string;
  distance?: number;
  estimatedTime?: number;
  failureReason?: string;
}

interface Staff {
  id: string;
  name: string;
  phone: string;
}

@Component({
  selector: 'app-delivery-list',
  standalone: true,
  imports: [RouterModule, DatePipe, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Delivery Assignments</h1>
        <p class="subtitle">Track and manage delivery orders</p>
      </div>
      <div class="header-actions">
        <a routerLink="staff" class="btn btn-secondary">👤 Manage Staff</a>
      </div>
    </div>

    <div class="filters-bar">
      <select (change)="onStatusFilter($event)" class="filter-select">
        <option value="">All Statuses</option>
        @for (s of statuses; track s.value) {
          <option [value]="s.value" [selected]="statusFilter() === s.value">{{ s.label }}</option>
        }
      </select>
      <select (change)="onStaffFilter($event)" class="filter-select">
        <option value="">All Staff</option>
        @for (member of staffList(); track member.id) {
          <option [value]="member.id" [selected]="staffFilter() === member.id">{{ member.name }}</option>
        }
      </select>
    </div>

    @if (loading()) {
      <div class="loading">Loading assignments...</div>
    } @else {
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Staff</th>
              <th>Status</th>
              <th>Assigned</th>
              <th>Delivered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (a of assignments(); track a.id) {
              <tr>
                <td class="order-number">{{ a.order.orderNumber }}</td>
                <td>{{ a.order.customer.name }}</td>
                <td>
                  <span class="staff-name">{{ a.deliveryStaff.name }}</span>
                  <span class="staff-phone">{{ a.deliveryStaff.phone }}</span>
                </td>
                <td>
                  <span class="status-badge" [class]="'status-' + a.status">
                    {{ formatStatus(a.status) }}
                  </span>
                </td>
                <td>{{ a.assignedAt | date:'dd MMM, hh:mm a' }}</td>
                <td>{{ a.deliveredAt ? (a.deliveredAt | date:'dd MMM, hh:mm a') : '—' }}</td>
                <td class="actions-cell">
                  @if (a.status !== 'delivered' && a.status !== 'failed') {
                    <select
                      class="status-select"
                      [value]="a.status"
                      (change)="updateStatus(a, $event)"
                    >
                      <option value="" disabled>Update...</option>
                      @for (ns of getNextStatuses(a.status); track ns.value) {
                        <option [value]="ns.value">→ {{ ns.label }}</option>
                      }
                    </select>
                  } @else {
                    <span class="done-label">{{ a.status === 'delivered' ? '✓ Done' : '✗ Failed' }}</span>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="empty">No assignments found</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="summary">
        {{ assignments().length }} assignment{{ assignments().length !== 1 ? 's' : '' }}
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h1 { margin: 0 0 0.25rem; color: #1e293b; font-size: 1.5rem; }
    .subtitle { color: #64748b; margin: 0; font-size: 0.875rem; }
    .header-actions { display: flex; gap: 0.75rem; }
    .btn { padding: 0.6rem 1.2rem; border-radius: 8px; text-decoration: none; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; }
    .btn-primary { background: #3b82f6; color: #fff; }
    .btn-primary:hover { background: #2563eb; }
    .btn-secondary { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .btn-secondary:hover { background: #e2e8f0; }
    .filters-bar { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; align-items: center; }
    .filter-select { padding: 0.6rem 1rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; background: #fff; }
    .loading { color: #64748b; padding: 3rem; text-align: center; }
    .table-card {
      background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      border: 1px solid #f1f5f9; overflow-x: auto;
    }
    table { width: 100%; border-collapse: collapse; }
    th {
      text-align: left; padding: 0.75rem 1rem; font-size: 0.75rem; font-weight: 600;
      text-transform: uppercase; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e2e8f0;
    }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem; color: #334155; }
    .order-number { font-weight: 600; color: #1e293b; }
    .staff-name { display: block; font-weight: 500; }
    .staff-phone { display: block; font-size: 0.75rem; color: #94a3b8; }
    .status-badge {
      padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 500;
      display: inline-block; white-space: nowrap;
    }
    .status-pending { background: #fef3c7; color: #d97706; }
    .status-assigned { background: #dbeafe; color: #2563eb; }
    .status-picked_up { background: #e0e7ff; color: #4f46e5; }
    .status-in_transit { background: #fef9c3; color: #a16207; }
    .status-delivered { background: #dcfce7; color: #16a34a; }
    .status-failed { background: #fee2e2; color: #dc2626; }
    .actions-cell { white-space: nowrap; }
    .status-select {
      padding: 0.35rem 0.6rem; border: 1px solid #e2e8f0; border-radius: 6px;
      font-size: 0.8rem; background: #fff; cursor: pointer;
    }
    .done-label { font-size: 0.8rem; color: #64748b; }
    .empty { text-align: center; color: #94a3b8; padding: 2rem; }
    .summary { text-align: center; color: #64748b; font-size: 0.85rem; margin-top: 1rem; }
  `],
})
export class DeliveryListPage implements OnInit {
  private api = inject(ApiService);

  assignments = signal<Assignment[]>([]);
  staffList = signal<Staff[]>([]);
  loading = signal(true);
  statusFilter = signal('');
  staffFilter = signal('');

  statuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'picked_up', label: 'Picked Up' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'failed', label: 'Failed' },
  ];

  ngOnInit() {
    this.loadStaff();
    this.loadAssignments();
  }

  loadStaff() {
    this.api.get<Staff[]>('/delivery/staff').subscribe({
      next: (res) => {
        this.staffList.set(res.data || []);
      },
    });
  }

  loadAssignments() {
    this.loading.set(true);
    const params: Record<string, string> = {};
    if (this.statusFilter()) params['status'] = this.statusFilter();
    if (this.staffFilter()) params['deliveryStaff'] = this.staffFilter();

    this.api.get<Assignment[]>('/delivery/assignments', params).subscribe({
      next: (res) => {
        this.assignments.set(res.data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onStatusFilter(event: Event) {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
    this.loadAssignments();
  }

  onStaffFilter(event: Event) {
    this.staffFilter.set((event.target as HTMLSelectElement).value);
    this.loadAssignments();
  }

  formatStatus(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pending',
      assigned: 'Assigned',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      failed: 'Failed',
    };
    return map[status] || status;
  }

  getNextStatuses(current: string): { value: string; label: string }[] {
    const flow: Record<string, { value: string; label: string }[]> = {
      pending: [{ value: 'assigned', label: 'Assigned' }],
      assigned: [
        { value: 'picked_up', label: 'Picked Up' },
        { value: 'failed', label: 'Failed' },
      ],
      picked_up: [
        { value: 'in_transit', label: 'In Transit' },
        { value: 'failed', label: 'Failed' },
      ],
      in_transit: [
        { value: 'delivered', label: 'Delivered' },
        { value: 'failed', label: 'Failed' },
      ],
    };
    return flow[current] || [];
  }

  updateStatus(assignment: Assignment, event: Event) {
    const newStatus = (event.target as HTMLSelectElement).value;
    if (!newStatus) return;

    let body: Record<string, string> = { status: newStatus };

    if (newStatus === 'failed') {
      const reason = prompt('Reason for delivery failure:');
      if (!reason) {
        (event.target as HTMLSelectElement).value = assignment.status;
        return;
      }
      body['failureReason'] = reason;
    }

    this.api.patch(`/delivery/assignments/${assignment.id}/status`, body).subscribe({
      next: () => this.loadAssignments(),
      error: () => {
        alert('Failed to update status');
        (event.target as HTMLSelectElement).value = assignment.status;
      },
    });
  }
}
