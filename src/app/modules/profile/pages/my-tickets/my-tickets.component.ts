import { ToastrService } from 'ngx-toastr';
import { Component, OnInit, signal } from '@angular/core';
import { OrderService } from '../../services/order.service';
import {
  Order,
  OrderListParams,
  OrderPageResponse,
} from '../../../../shared/models/order.model';
import { Skeleton } from 'primeng/skeleton';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Paginator } from 'primeng/paginator';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { CheckIn } from '../../../../shared/models/check-in.model';
import { CheckInService } from '../../../organizer/services/checkin.service';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-my-tickets',
  templateUrl: './my-tickets.component.html',
  styleUrls: ['./my-tickets.component.css'],
  standalone: true,
  imports: [
    Skeleton,
    CommonModule,
    FormsModule,
    Paginator,
    InputTextModule,
    ButtonModule,
    TableModule,
    TagModule,
    DialogModule,
    QRCodeComponent,
  ],
  providers: [MessageService],
})
export class MyTicketsComponent implements OnInit {
  orders: Order[] = [];
  totalElements = 0;
  totalPages = 0;
  isLoading = signal(false);

  // Dialog state
  displayTicketDialog = false;
  selectedOrder: Order | null = null;
  checkIns: CheckIn[] = [];
  currentTicketIndex = 0;
  loadingCheckIns = false;

  // pagination + filter
  currentPage = 0;
  pageSize = 10;
  sortBy: string = 'createdAt';
  sortDirection: 'ASC' | 'DESC' = 'DESC';
  searchTerm = '';

  constructor(
    private orderService: OrderService,
    private checkInService: CheckInService,
    private messageService: MessageService,
    private toastrService: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);
    const params: OrderListParams = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection,
    };

    this.orderService.getOrders(params).subscribe({
      next: (res: OrderPageResponse) => {
        this.orders = res.content;
        this.totalElements = res.totalElements;
        this.totalPages = res.totalPages;
        this.isLoading.set(false);
      },
      error: () => {
        this.orders = [];
        this.isLoading.set(false);
      },
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadOrders();
  }

  onPageChange(event: any): void {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.loadOrders();
  }

  onSort(event: any): void {
    this.sortBy = event.field;
    this.sortDirection = event.order === 1 ? 'ASC' : 'DESC';
    this.loadOrders();
  }

  trackByOrderId(index: number, order: Order): string {
    return order.id;
  }

  /** View Ticket Dialog */
  onViewTicket(order: Order): void {
    this.selectedOrder = order;
    this.currentTicketIndex = 0;
    this.displayTicketDialog = true;
    this.loadCheckIns(order.id);
  }

  loadCheckIns(orderId: string): void {
    this.loadingCheckIns = true;
    this.checkInService.getCheckInsByOrderId(orderId).subscribe({
      next: (checkIns: CheckIn[]) => {
        this.checkIns = checkIns;
        this.loadingCheckIns = false;
      },
      error: (error) => {
        console.error('Error loading check-ins:', error);
        this.checkIns = [];
        this.loadingCheckIns = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải thông tin vé',
        });
      },
    });
  }

  get currentCheckIn(): CheckIn | null {
    return this.checkIns[this.currentTicketIndex] || null;
  }

  previousTicket(): void {
    if (this.currentTicketIndex > 0) {
      this.currentTicketIndex--;
    }
  }

  nextTicket(): void {
    if (this.currentTicketIndex < this.checkIns.length - 1) {
      this.currentTicketIndex++;
    }
  }

  canGoPrevious(): boolean {
    return this.currentTicketIndex > 0;
  }

  canGoNext(): boolean {
    return this.currentTicketIndex < this.checkIns.length - 1;
  }

  downloadTicket(): void {
    if (!this.currentCheckIn) return;

    const ticketElement = document.getElementById('ticket-content');
    if (!ticketElement) return;

    import('html2canvas')
      .then((module) => {
        const html2canvas = module.default;
        return html2canvas(ticketElement, { useCORS: true, logging: false });
      })
      .then((canvas) => {
        const link = document.createElement('a');
        const timestamp = new Date().getTime();
        link.download = `ticket-${
          this.currentCheckIn!.checkInCode
        }-${timestamp}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        this.toastrService.success('Tải vé thành công');
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Tải vé thành công',
        });
      })
      .catch((error) => {
        console.error('Error downloading ticket:', error);
        this.toastrService.error('Không thể tải xuống vé. Vui lòng thử lại.');
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải xuống vé. Vui lòng thử lại.',
        });
      });
  }

  getStatusBadgeClass(status: string): string {
    const classMap: { [key: string]: string } = {
      PENDING: 'status-pending',
      CHECKED_IN: 'status-checked-in',
      CANCELLED: 'status-cancelled',
    };
    return classMap[status] || 'status-pending';
  }

  getStatusLabel(status: string): string {
    const labelMap: { [key: string]: string } = {
      PENDING: 'Chưa sử dụng',
      CHECKED_IN: 'Đã check-in',
      CANCELLED: 'Đã hủy',
    };
    return labelMap[status] || status;
  }

  /** Format ngày */
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatDateTime(dateStr: string): string {
    return `${this.formatDate(dateStr)} ${this.formatTime(dateStr)}`;
  }

  /** Format tiền */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  getEventStatus(createdAt: string): 'upcoming' | 'past' | 'ongoing' {
    const eventDate = new Date(createdAt);
    const now = new Date();

    if (eventDate > now) return 'upcoming';
    if (eventDate.toDateString() === now.toDateString()) return 'ongoing';
    return 'past';
  }

  getStatusSeverity(status: string): 'success' | 'warning' | 'danger' | 'info' {
    const severityMap = {
      upcoming: 'success' as const,
      ongoing: 'warning' as const,
      past: 'danger' as const,
    };
    return severityMap[status as keyof typeof severityMap] || 'info';
  }

  getEventStatusLabel(status: string): string {
    const labelMap = {
      upcoming: 'Sắp diễn ra',
      ongoing: 'Đang diễn ra',
      past: 'Đã kết thúc',
    };
    if (status in labelMap) {
      return labelMap[status as keyof typeof labelMap];
    }
    return '';
  }
}
