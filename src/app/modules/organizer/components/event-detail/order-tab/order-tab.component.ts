import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  signal,
  computed,
  OnDestroy,
} from '@angular/core';
import {
  Order,
  OrderListParams,
} from '../../../../../shared/models/order.model';
import { OrderService } from '../../../services/order.service';
import {
  catchError,
  finalize,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Events } from '../../../../../shared/models/event.model';
import { Zone } from '../../../../../shared/models/zone.model';

@Component({
  selector: 'app-orders-tab',
  templateUrl: './order-tab.component.html',
  styleUrls: ['./order-tab.component.css'],
  imports: [CommonModule],
})
export class OrdersTabComponent implements OnInit, OnChanges, OnDestroy {
  @Input() event!: Events;

  // Convert to signals
  orders = signal<Order[]>([]);
  allOrders = signal<Order[]>([]);
  loading = signal<boolean>(false);
  error = signal<string>('');

  // Pagination signals
  currentPage = signal<number>(0);
  pageSize = signal<number>(10);
  totalElements = signal<number>(0);
  totalPages = signal<number>(0);

  // Filter signals
  selectedZoneId = signal<string>('');
  sortBy = signal<'createdAt' | 'totalAmount' | 'quantity'>('createdAt');
  sortDirection = signal<'ASC' | 'DESC'>('DESC');
  searchTerm = signal<string>('');
  searchSubject = new Subject<string>();

  // Available zones from event
  availableZones = signal<Zone[]>([]);

  // Zone statistics
  zoneStats = signal<
    Map<string, { sold: number; total: number; revenue: number }>
  >(new Map());

  // Computed signals
  sortText = computed(() => {
    const sortLabels: { [key: string]: string } = {
      createdAt_DESC: 'Mới nhất',
      createdAt_ASC: 'Cũ nhất',
      totalAmount_DESC: 'Giá cao nhất',
      totalAmount_ASC: 'Giá thấp nhất',
      quantity_DESC: 'Số lượng nhiều nhất',
      quantity_ASC: 'Số lượng ít nhất',
    };
    return sortLabels[`${this.sortBy()}_${this.sortDirection()}`] || 'Mặc định';
  });

  selectedZoneName = computed(() => {
    if (!this.selectedZoneId()) return 'Tất cả Zone';
    const zone = this.getZoneById(this.selectedZoneId());
    return zone ? zone.name : 'Tất cả Zone';
  });

  hasAlmostFullZones = computed(() => {
    return this.availableZones().some((zone) =>
      this.isZoneAlmostFull(zone.id.toString())
    );
  });

  almostFullZones = computed(() => {
    return this.availableZones().filter((zone) =>
      this.isZoneAlmostFull(zone.id.toString())
    );
  });

  hasActiveFilters = computed(() => {
    return !!this.selectedZoneId() || !!this.searchTerm();
  });

  constructor(private orderService: OrderService) {
    // Setup search debounce
    this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.applyClientSideFilter();
      });
  }

  ngOnInit(): void {
    console.log('🔄 OrdersTabComponent ngOnInit - Loading fresh data from API');
    this.initializeZones();
    this.loadOrders();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['event'] && this.event && !changes['event'].firstChange) {
      console.log('🔄 Event changed - Reloading data');
      this.initializeZones();
      this.loadOrders();
    }
  }

  ngOnDestroy(): void {
    console.log('🗑️ OrdersTabComponent destroyed');
    this.searchSubject.complete();
  }

  initializeZones(): void {
    if (this.event && this.event.zones) {
      this.availableZones.set(this.event.zones);
      this.calculateZoneStats();
    }
  }

  calculateZoneStats(): void {
    const stats = new Map<
      string,
      { sold: number; total: number; revenue: number }
    >();

    this.availableZones().forEach((zone) => {
      stats.set(zone.id.toString(), {
        sold: zone.soldTickets || 0,
        total: zone.maxTickets || 0,
        revenue: (zone.soldTickets || 0) * zone.price,
      });
    });

    this.zoneStats.set(stats);
  }

  loadOrders(): void {
    if (!this.event) return;

    this.loading.set(true);
    this.error.set('');

    const params: OrderListParams = {
      page: this.currentPage(),
      size: this.pageSize(),
      sortBy: this.sortBy(),
      sortDirection: this.sortDirection(),
    };

    // Thêm zoneId vào params nếu có filter
    if (this.selectedZoneId()) {
      params.zoneId = this.selectedZoneId();
    }

    console.log('📡 Calling API to load orders with params:', params);

    this.orderService
      .getOrdersByEvent(this.event.id, params)
      .pipe(
        catchError((error) => {
          this.error.set('Không thể tải danh sách đơn hàng');
          console.error('❌ Error loading orders:', error);
          return of({
            content: [],
            totalElements: 0,
            totalPages: 0,
            page: this.currentPage(),
            size: this.pageSize(),
          });
        }),
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe((response) => {
        console.log(
          '✅ Orders loaded successfully:',
          response.content.length,
          'orders'
        );
        this.allOrders.set(response.content);
        this.totalElements.set(response.totalElements);
        this.totalPages.set(response.totalPages);
        this.currentPage.set(response.page);

        // Apply client-side search filter if any
        this.applyClientSideFilter();
      });
  }

  applyClientSideFilter(): void {
    let filtered = [...this.allOrders()];

    // Filter by search term (client-side)
    const term = this.searchTerm();
    if (term) {
      const lowerTerm = term.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(lowerTerm) ||
          order.nameZone.toLowerCase().includes(lowerTerm) ||
          order.nameEvent.toLowerCase().includes(lowerTerm)
      );
    }

    this.orders.set(filtered);
  }

  onZoneFilterChange(zoneId: string): void {
    this.selectedZoneId.set(zoneId);
    this.currentPage.set(0);
    this.loadOrders();
  }

  onSortChange(sort: string): void {
    const [field, direction] = sort.split('_');
    this.sortBy.set(field as 'createdAt' | 'totalAmount' | 'quantity');
    this.sortDirection.set(direction as 'ASC' | 'DESC');
    this.currentPage.set(0);
    this.loadOrders();
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  clearFilters(): void {
    this.selectedZoneId.set('');
    this.searchTerm.set('');
    this.currentPage.set(0);
    this.loadOrders();
  }

  viewOrderDetail(order: Order): void {
    console.log('View order detail:', order);

    const message = `
Chi tiết đơn hàng
─────────────────────
📋 Mã đơn: ${order.id.substring(0, 13)}...
🎫 Zone: ${order.nameZone}
🎪 Sự kiện: ${order.nameEvent}
📊 Số lượng: ${order.quantity} vé
💰 Đơn giá: ${this.formatCurrency(order.priceZone)}
💵 Tổng tiền: ${this.formatCurrency(order.totalAmount)}
📅 Ngày mua: ${this.formatDateTime(order.createdAt)}
    `.trim();

    alert(message);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadOrders();
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('vi-VN');
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleString('vi-VN');
  }

  getZoneSoldPercentage(zoneId: string): number {
    const stats = this.zoneStats().get(zoneId);
    if (!stats || stats.total === 0) return 0;
    return (stats.sold / stats.total) * 100;
  }

  getZoneRemainingTickets(zoneId: string): number {
    const stats = this.zoneStats().get(zoneId);
    if (!stats) return 0;
    return stats.total - stats.sold;
  }

  getProgressBarColor(percentage: number): string {
    if (percentage >= 90) return '#e74c3c'; // Red
    if (percentage >= 70) return '#f39c12'; // Orange
    return '#667eea'; // Blue
  }

  isZoneAlmostFull(zoneId: string): boolean {
    return this.getZoneSoldPercentage(zoneId) >= 90;
  }

  exportToExcel(): void {
    alert('Chức năng xuất Excel đang được phát triển');
  }

  createNewOrder(): void {
    alert('Chức năng tạo đơn mới đang được phát triển');
  }

  getZoneById(zoneId: string): Zone | undefined {
    return this.availableZones().find((z) => z.id.toString() === zoneId);
  }

  getZoneIcon(zoneName: string): string {
    const name = zoneName.toLowerCase();
    if (name.includes('vip') || name.includes('a')) {
      return 'fa-star';
    } else if (name.includes('b')) {
      return 'fa-crown';
    }
    return 'fa-users';
  }

  getZoneIconColor(zoneName: string): string {
    const name = zoneName.toLowerCase();
    if (name.includes('vip') || name.includes('a')) {
      return '#ffd700';
    } else if (name.includes('b')) {
      return '#c0c0c0';
    }
    return '#cd7f32';
  }
}
