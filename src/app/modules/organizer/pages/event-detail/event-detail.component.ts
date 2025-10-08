import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

import { Events } from '../../../../shared/models/event.model';
import { CreateEventService } from '../../services/events.service';
import { CommonModule } from '@angular/common';
import { CheckinTabComponent } from '../../components/event-detail/check-in-tab/check-in-tab.component';
import { OrdersTabComponent } from '../../components/event-detail/order-tab/order-tab.component';

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.css'],
  imports: [CommonModule, CheckinTabComponent, OrdersTabComponent],
  providers: [],
})
export class EventDetailComponent implements OnInit {
  eventId: string = '';

  // Convert to signals for reactive updates
  event = signal<Events | null>(null);
  loading = signal<boolean>(false);
  error = signal<string>('');
  activeTab = signal<'orders' | 'checkin'>('orders');

  // Statistics as signals
  totalTicketsSold = signal<number>(0);
  totalRevenue = signal<number>(0);
  totalCheckedIn = signal<number>(0);
  totalNotCheckedIn = signal<number>(0);

  // Computed signals for helper methods
  isOrdersTabActive = computed(() => this.activeTab() === 'orders');
  isCheckinTabActive = computed(() => this.activeTab() === 'checkin');

  // Computed signal for event status based on time
  eventTimeStatus = computed(() => {
    const currentEvent = this.event();
    if (!currentEvent) return null;

    const now = new Date();
    const startDateTime = this.combineDateAndTime(
      currentEvent.startDate,
      currentEvent.startTime
    );
    const endDateTime = this.combineDateAndTime(
      currentEvent.endDate,
      currentEvent.endTime
    );

    if (now < startDateTime) {
      return {
        status: 'upcoming',
        label: 'Sắp diễn ra',
        icon: 'fas fa-clock',
        class: 'upcoming',
      };
    } else if (now >= startDateTime && now <= endDateTime) {
      return {
        status: 'ongoing',
        label: 'Đang diễn ra',
        icon: 'fas fa-check-circle',
        class: 'ongoing',
      };
    } else {
      return {
        status: 'ended',
        label: 'Đã kết thúc',
        icon: 'fas fa-flag-checkered',
        class: 'ended',
      };
    }
  });

  constructor(
    private route: ActivatedRoute,
    private eventService: CreateEventService
  ) {}

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    if (this.eventId) {
      this.loadEventDetails();
      this.scrollToTop();
    }
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0 });
  }

  loadEventDetails(): void {
    this.loading.set(true);
    this.error.set('');

    this.eventService
      .getEventDetailsById(this.eventId)
      .pipe(
        catchError((error) => {
          this.error.set('Không thể tải thông tin sự kiện');
          console.error('Error loading event details:', error);
          return of(null);
        }),
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe((event) => {
        if (event) {
          this.event.set(event);
          console.log('Event loaded:', this.event()?.eventName);
          this.calculateStatistics();
        }
      });
  }

  calculateStatistics(): void {
    const currentEvent = this.event();
    if (!currentEvent) return;

    // Calculate total tickets sold and revenue from zones
    const ticketsSold = currentEvent.zones.reduce(
      (sum, zone) => sum + (zone.soldTickets || 0),
      0
    );
    this.totalTicketsSold.set(ticketsSold);

    const revenue = currentEvent.zones.reduce(
      (sum, zone) => sum + (zone.soldTickets || 0) * zone.price,
      0
    );
    this.totalRevenue.set(revenue);

    // These will be updated by check-in component
    this.totalCheckedIn.set(0);
    this.totalNotCheckedIn.set(0);
  }

  switchTab(tab: 'orders' | 'checkin'): void {
    console.log(`Switching to tab: ${tab}`);
    this.activeTab.set(tab);
    // Component sẽ được destroy và recreate, ngOnInit sẽ chạy lại
  }

  updateCheckInStats(stats: { checkedIn: number; notCheckedIn: number }): void {
    this.totalCheckedIn.set(stats.checkedIn);
    this.totalNotCheckedIn.set(stats.notCheckedIn);
  }

  /**
   * Combine date and time strings into a Date object
   * @param dateStr - Date string in format "YYYY-MM-DD"
   * @param timeStr - Time string in format "HH:mm"
   * @returns Date object
   */
  private combineDateAndTime(dateStr: string, timeStr: string): Date {
    return new Date(`${dateStr}T${timeStr}`);
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

  formatTime(time: string): string {
    return time;
  }

  // Helper methods for template - use signals directly
  isTabActive(tab: 'orders' | 'checkin'): boolean {
    return this.activeTab() === tab;
  }
}
