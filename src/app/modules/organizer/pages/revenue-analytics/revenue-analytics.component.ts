import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChartModule } from 'primeng/chart';
import {
  trigger,
  transition,
  style,
  animate,
  stagger,
  query,
} from '@angular/animations';
import { Subject, forkJoin, lastValueFrom } from 'rxjs';
import {
  AnalyticsFilterOptions,
  EventTypeRevenue,
  MetricData,
  RevenueData,
  TopEvent,
} from '../../../../shared/models/analytics.model'; //
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-revenue-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    ChartModule,
  ],
  templateUrl: './revenue-analytics.component.html',
  styleUrls: ['./revenue-analytics.component.css'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate(
          '0.6s ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate(
          '0.4s ease-out',
          style({ opacity: 1, transform: 'translateX(0)' })
        ),
      ]),
    ]),
    trigger('staggerCards', [
      transition(':enter', [
        query(
          '.metric-card',
          [
            style({ opacity: 0, transform: 'translateY(30px)' }),
            stagger('100ms', [
              animate(
                '0.6s ease-out',
                style({ opacity: 1, transform: 'translateY(0)' })
              ),
            ]),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
})
export class RevenueAnalyticsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private analyticsService = inject(AnalyticsService);

  loading = signal(true);
  selectedYear = signal(new Date().getFullYear());
  selectedEventType = signal('all');

  monthlyRevenue = signal<RevenueData[]>([]);
  eventTypeRevenue = signal<EventTypeRevenue[]>([]);
  topEvents = signal<TopEvent[]>([]);
  metrics = signal<MetricData[]>([]);

  revenueChartData: any;
  revenueChartOptions: any;
  pieChartData: any;
  pieChartOptions: any;

  totalRevenue = computed(() =>
    this.monthlyRevenue().reduce((sum, item) => sum + item.revenue, 0)
  );
  totalOrders = computed(() =>
    this.monthlyRevenue().reduce((sum, item) => sum + item.orders, 0)
  );
  totalEvents = computed(
    () => new Set(this.topEvents().map((e) => e.name)).size
  );
  totalTickets = computed(() =>
    this.topEvents().reduce((sum, item) => sum + item.tickets, 0)
  );
  avgOrderValue = computed(() =>
    this.totalOrders() > 0 ? this.totalRevenue() / this.totalOrders() : 0
  );

  filterOptions = {
    years: [2025, 2024, 2023, 2022],
    eventTypes: [
      { value: 'all', label: 'Tất cả loại sự kiện' },
      { value: 'Hội thảo', label: 'Hội thảo' },
      { value: 'Sự kiện thể thao', label: 'Sự kiện thể thao' },
      { value: 'Nghệ thuật', label: 'Nghệ thuật' },
      { value: 'Âm nhạc', label: 'Âm nhạc' },
      { value: 'Giáo dục', label: 'Giáo dục' },
      { value: 'Công nghệ', label: 'Công nghệ' },
      { value: 'Giải trí', label: 'Giải trí' },
    ],
  };

  constructor() {
    this.initChartOptions();
  }

  ngOnInit() {
    this.loadAnalyticsData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadAnalyticsData() {
    this.loading.set(true);
    const filters: AnalyticsFilterOptions = {
      year: this.selectedYear(),
      eventType: this.selectedEventType(),
    };

    try {
      const { revenueData, eventTypeRevenueData, topEventsData } =
        await lastValueFrom(
          forkJoin({
            revenueData: this.analyticsService.getRevenueData(filters),
            eventTypeRevenueData:
              this.analyticsService.getEventTypeRevenue(filters),
            topEventsData: this.analyticsService.getTopEvents(filters),
          })
        );

      this.monthlyRevenue.set(revenueData);
      this.eventTypeRevenue.set(
        this.addColorsToEventTypeData(eventTypeRevenueData)
      );
      this.topEvents.set(this.addMockGrowthAndStatus(topEventsData));

      this.updateChartData();
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private updateChartData() {
    this.updateRevenueChart();
    this.updatePieChart();
  }

  private updateRevenueChart() {
    const data = this.monthlyRevenue();
    const months = [
      'Tháng 1',
      'Tháng 2',
      'Tháng 3',
      'Tháng 4',
      'Tháng 5',
      'Tháng 6',
      'Tháng 7',
      'Tháng 8',
      'Tháng 9',
      'Tháng 10',
      'Tháng 11',
      'Tháng 12',
    ];
    const revenueByMonth = new Map(
      data.map((item) => [new Date(item.month + '-02').getMonth(), item])
    );

    const chartRevenueData = months.map(
      (_, index) => revenueByMonth.get(index)?.revenue || 0
    );
    const chartOrdersData = months.map(
      (_, index) => revenueByMonth.get(index)?.orders || 0
    );

    this.revenueChartData = {
      labels: months,
      datasets: [
        {
          label: 'Doanh thu',
          data: chartRevenueData,
          borderColor: '#667eea',
          tension: 0.4,
          fill: true,
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
        },
        {
          label: 'Số đơn hàng',
          data: chartOrdersData,
          borderColor: '#764ba2',
          tension: 0.4,
          fill: false,
        },
      ],
    };
  }

  private updatePieChart() {
    const data = this.eventTypeRevenue();
    this.pieChartData = {
      labels: data.map((item) => item.name),
      datasets: [
        {
          data: data.map((item) => item.revenue),
          backgroundColor: data.map((item) => item.color),
        },
      ],
    };
  }

  // --- EVENT HANDLERS ---
  onYearChange(year: number) {
    this.selectedYear.set(year);
    this.loadAnalyticsData();
  }

  onEventTypeChange(eventType: string) {
    this.selectedEventType.set(eventType);
    this.loadAnalyticsData();
  }

  onExportReport() {
    console.log('Exporting report...');
  }

  onViewEventDetails(eventName: string) {
    console.log('Viewing details for:', eventName);
  }

  // --- UTILITY & FORMATTING ---
  formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  formatNumber = (value: number) =>
    new Intl.NumberFormat('vi-VN').format(value);
  formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  getMetricsData(): MetricData[] {
    return [
      {
        icon: 'attach_money',
        title: 'Tổng doanh thu',
        value: this.formatCurrency(this.totalRevenue()),
        subtitle: `Từ ${this.totalOrders()} đơn hàng`,
        trend: '+12.5%',
        color: 'revenue',
      },
      {
        icon: 'shopping_cart',
        title: 'Tổng đơn hàng',
        value: this.formatNumber(this.totalOrders()),
        subtitle: 'Đơn hàng đã xử lý',
        trend: '+8.2%',
        color: 'orders',
      },
      {
        icon: 'event',
        title: 'Sự kiện có DS',
        value: this.formatNumber(this.totalEvents()),
        subtitle: `Bán ${this.formatNumber(this.totalTickets())} vé`,
        trend: '+15.3%',
        color: 'events',
      },
      {
        icon: 'trending_up',
        title: 'Giá trị TB/Đơn',
        value: this.formatCurrency(this.avgOrderValue()),
        subtitle: 'Mỗi đơn hàng',
        trend: '+5.8%',
        color: 'avg',
      },
    ];
  }

  getStatusClass = (status: string) => `status-${status}`;
  getTrendClass = (trend: string) =>
    trend.startsWith('+') ? 'trend-positive' : 'trend-negative';

  private addColorsToEventTypeData(
    data: EventTypeRevenue[]
  ): EventTypeRevenue[] {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'];
    return data.map((item, index) => ({
      ...item,
      color: colors[index % colors.length],
    }));
  }

  private addMockGrowthAndStatus(events: TopEvent[]): TopEvent[] {
    const statuses: ('active' | 'completed' | 'upcoming')[] = [
      'completed',
      'active',
      'upcoming',
    ];
    return events.map((event) => ({
      ...event,
      growth: `${(Math.random() * 20 - 5).toFixed(1)}%`,
    }));
  }

  getZoneAnalysis() {
    return [];
  }
  getTimelineChartData() {
    return {};
  }
  getTimelineChartOptions() {
    return this.revenueChartOptions;
  }

  private initChartOptions() {
    this.revenueChartOptions = {
      plugins: {
        legend: { labels: { usePointStyle: true, color: '#495057' } },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#1e293b',
          bodyColor: '#374151',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: (context: any) =>
              `${context.dataset.label}: ${this.formatCurrency(
                context.parsed.y
              )}`,
          },
        },
      },
      scales: {
        x: { ticks: { color: '#495057' }, grid: { color: '#ebedef' } },
        y: {
          ticks: {
            color: '#495057',
            callback: (value: any) => this.formatCurrency(value),
          },
          grid: { color: '#ebedef' },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    };

    this.pieChartOptions = {
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#1e293b',
          bodyColor: '#374151',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = this.formatCurrency(context.parsed);
              const percentage = (
                (context.parsed / this.totalRevenue()) *
                100
              ).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    };
  }
}
