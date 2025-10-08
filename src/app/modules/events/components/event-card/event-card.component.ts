import { CreateEventService } from './../../../organizer/services/events.service';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Events } from '../../../../shared/models/event.model';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.css'],
})
export class EventCardComponent {
  @Input() event!: Events;
  @Input() defaultImage = 'assets/images/notfoundimg.webp';
  @Output() viewDetails = new EventEmitter<Events>();

  constructor(private createEventService: CreateEventService) {}

  getEventImage(): string | null {
    if (this.event.eventBanner) {
      return this.getImg(this.event.eventBanner);
    }
    return this.defaultImage;
  }

  getImg(url: string): string | null {
    if (!url) return null;
    return this.createEventService.urlImg(url);
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = this.defaultImage;
    }
  }

  getStatusText(): string {
    switch (this.event.eventStatus) {
      case 'PUBLISHED':
        if (this.hasEventStarted())
          return this.hasEventEnded() ? 'Đã kết thúc' : 'Đang diễn ra';
        return 'Đang bán';
      case 'DRAFT':
        return 'Sắp mở';
      default:
        return 'Sắp mở';
    }
  }

  getStatusClass(): string {
    switch (this.event.eventStatus) {
      case 'PUBLISHED':
        if (this.hasEventStarted())
          return this.hasEventEnded() ? 'status-end' : 'status-on-going';
        return 'status-ready';
      case 'DRAFT':
        return 'status-ready';
      default:
        return 'status-end';
    }
  }

  formatDateTime(dateStr: string, timeStr?: string): string {
    try {
      const date = new Date(dateStr);
      const formattedDate = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      if (timeStr) {
        return `${formattedDate} • ${timeStr}`;
      }

      return formattedDate;
    } catch {
      return timeStr ? `${dateStr} • ${timeStr}` : dateStr;
    }
  }

  minPriceZone(event: Events): string {
    const minPrice = Math.min(
      ...event.zones.filter((zone) => zone.isSellable).map((zone) => zone.price)
    );
    if (minPrice == 0) return 'Miễn Phí';
    return this.formatPrice(minPrice);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  }

  isLateTime(): boolean {
    if (this.event && this.event.startDate && this.event.startTime) {
      const eventDateTime = new Date(
        `${this.event.startDate}T${this.event.startTime}`
      );

      const now = new Date();

      return eventDateTime <= now;
    }
    return false;
  }

  onCardClick(): void {
    this.viewDetails.emit(this.event);
  }

  getAvailableSeats(): number {
    if (!this.event.zones || this.event.zones.length === 0) return 0;

    return this.event.zones.reduce((total, zone) => {
      const maxTickets = zone.maxTickets || 0;
      const soldTickets = zone.maxTickets || 0;
      return total + Math.max(0, maxTickets - soldTickets);
    }, 0);
  }

  getTotalSeats(): number {
    if (!this.event.zones || this.event.zones.length === 0) return 0;
    return this.event.zones.reduce(
      (total, zone) => total + (zone.maxTickets || 0),
      0
    );
  }

  getFullAddress(): string {
    const venue = this.event.venue;
    if (!venue) return 'Chưa có thông tin địa điểm';

    const parts = [venue.address, venue.province].filter(Boolean);
    return parts.join(', ');
  }

  getShortAddress(): string {
    const venue = this.event.venue;
    if (!venue) return 'Chưa có thông tin';

    const parts = [venue.province].filter(Boolean);
    return parts.join(', ') || venue.address || 'Chưa có thông tin';
  }

  isEventSoon(): boolean {
    try {
      const eventDate = new Date(
        `${this.event.startDate}T${this.event.startTime || '00:00'}`
      );
      const now = new Date();

      // Khoảng cách tính theo ngày (có phần thập phân để phản ánh giờ/phút)
      const diffInDays =
        (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      // Trong vòng 7 ngày tới và chưa quá giờ hiện tại
      return diffInDays <= 7 && diffInDays >= 0;
    } catch {
      return false;
    }
  }

  isEventToday(): boolean {
    try {
      const eventDate = new Date(this.event.startDate);
      const today = new Date();
      return (
        eventDate.getDate() === today.getDate() &&
        eventDate.getMonth() === today.getMonth() &&
        eventDate.getFullYear() === today.getFullYear()
      );
    } catch {
      return false;
    }
  }

  getCategoryDisplayName(): string {
    return this.event.eventCategory || 'Sự kiện';
  }

  getAttendeeCount(): number {
    const totalSeats = this.getTotalSeats();
    const availableSeats = this.getAvailableSeats();
    return Math.max(0, totalSeats - availableSeats);
  }

  getAttendeeText(): string {
    const count = this.getAttendeeCount();
    return `${count} người tham gia`;
  }

  formatNumber(num: number): string {
    return num.toLocaleString('vi-VN');
  }

  hasEventStarted(): boolean {
    try {
      const now = new Date();
      const eventStart = new Date(
        `${this.event.startDate}T${this.event.startTime || '00:00'}`
      );
      return now >= eventStart;
    } catch {
      return false;
    }
  }

  hasEventEnded(): boolean {
    try {
      const now = new Date();
      const eventEnd = new Date(
        `${this.event.endDate}T${this.event.endTime || '23:59'}`
      );
      console.log(now, eventEnd, " kiemtra date", now > eventEnd);
      return now > eventEnd;
    } catch {
      return false;
    }
  }
}
