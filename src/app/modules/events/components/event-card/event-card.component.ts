import { CreateEventService } from './../../../organizer/services/events.service';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Events } from '../../../../shared/models/event.model';

@Component({
  selector: 'app-event-card',
  imports: [CommonModule, CardModule, ButtonModule, TagModule],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.css',
})
export class EventCardComponent {
  @Input() event!: Events;
  @Input() defaultImage = 'assets/images/notfoundimg.webp';
  @Output() bookEvent = new EventEmitter<Events>();
  @Output() imageError = new EventEmitter<Event>();
  constructor(private createEventService: CreateEventService) {}

  getEventImage(): string {
    // You'll need to implement this method or pass it from parent
    return this.event.eventBanner || this.defaultImage;
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.defaultImage;
    this.imageError.emit(event);
  }

  getStatusText(): string {
    return this.event.status === 'PUBLISHED' ? 'Đang bán' : 'Sắp mở';
  }

  getStatusSeverity():
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'secondary'
    | 'contrast' {
    return this.event.status === 'PUBLISHED' ? 'success' : 'warning';
  }

  formatDateTime(dateStr: string, timeStr: string): string {
    try {
      const date = new Date(dateStr);
      const formattedDate = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      return `${formattedDate} - ${timeStr}`;
    } catch {
      return `${dateStr} - ${timeStr}`;
    }
  }

  getAvailableSeats(): number {
    if (!this.event.zones || this.event.zones.length === 0) return 0;
    return this.event.zones.reduce(
      (total, zone) => total + (zone.maxTickets || 0),
      0
    );
  }

  getTotalSeats(): number {
    if (!this.event.zones || this.event.zones.length === 0) return 0;
    return this.event.zones.reduce(
      (total, zone) => total + (zone.maxTickets || 0),
      0
    );
  }

  formatPrice(): string {
    const zones = this.event.zones;
    if (!zones || zones.length === 0) {
      return 'Liên hệ';
    }

    const prices = zones.map((zone) => zone.price).filter((price) => price > 0);
    if (prices.length === 0) {
      return 'Miễn phí';
    }

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return `${minPrice.toLocaleString('vi-VN')}₫`;
    }

    return `${minPrice.toLocaleString('vi-VN')}₫ - ${maxPrice.toLocaleString(
      'vi-VN'
    )}₫`;
  }

  getButtonText(): string {
    if (this.event.status !== 'PUBLISHED') {
      return 'Sắp mở bán';
    }
    if (this.getAvailableSeats() === 0) {
      return 'Hết vé';
    }
    return 'Xem chi tiết';
  }

  isBookingDisabled(): boolean {
    return this.event.status !== 'PUBLISHED' || this.getAvailableSeats() === 0;
  }

  onBookEvent(): void {
    if (!this.isBookingDisabled()) {
      this.bookEvent.emit(this.event);
    }
  }

  getImg(url: string): string | null {
    if (!url) return null;
    return this.createEventService.urlImg(url);
  }
}
