// src/app/components/events-list/components/event-card/event-card.component.ts
import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Events } from '../../../../shared/models/event.model';
import { CreateEventService } from '../../services/events.service';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatChipsModule],
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.css'],
})
export class EventCardComponent {
  @Input() event!: Events;
  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();
  imageUrl!: string;

  constructor(
    private createEventService: CreateEventService,
    private changeDetectionRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.imageUrl = this.getImg(this.event.eventImage) || "null";
  }

  onEdit() {
    this.edit.emit(this.event.id);
  }

  onDelete() {
    this.delete.emit(this.event.id);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatTime(timeStr?: string | null): string {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  getStatusBadgeClass(status: 'DRAFT' | 'PUBLISHED'): string {
    return status === 'PUBLISHED' ? 'status-published' : 'status-draft';
  }

  getStatusText(status: 'DRAFT' | 'PUBLISHED'): string {
    return status === 'PUBLISHED' ? 'Đã xuất bản' : 'Nháp';
  }

  getDefaultImage(): string {
    return 'assets/images/default-event-image.jpg';
  }

  getImg(url: string): string | null {
    if (!url) return null;
    return this.createEventService.urlImg(url);
  }

  onImageError(event: any) {
    //event.target.src = this.getDefaultImage();
  }
}
