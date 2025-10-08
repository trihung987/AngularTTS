// src/app/components/events-list/events-list.component.ts
import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// PrimeNG imports
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

import {
  Subject,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  firstValueFrom,
} from 'rxjs';

import { EventsListService } from '../../services/events-list.service';
import { EventsListParams } from '../../../../shared/models/events-list.model';
import { EventCardComponent } from '../../components/event-card/event-card.component';
import { EventsPaginationComponent } from '../../components/events-pagination/events-pagination.component';
import { Events } from '../../../../shared/models/event.model';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    EventCardComponent,
    EventsPaginationComponent,
    // PrimeNG imports
    DialogModule,
    ButtonModule,
  ],
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.css'],
})
export class EventsListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Data
  events: Events[] = [];
  totalElements = 0;
  totalPages = 0;
  currentPage = 1;
  pageSize = 12;

  // UI State
  loading = signal(false);
  selectedTab = 0;
  searchQuery = '';

  // Delete confirmation dialog state
  showDeleteDialog = false;
  eventToDelete: Events | null = null;
  isDeleting = false;

  // Tab configuration
  tabs = [
    { label: 'Tất cả', status: 'ALL' as const },
    { label: 'Bản nháp', status: 'DRAFT' as const },
    { label: 'Đã xuất bản', status: 'PUBLISHED' as const },
    { label: 'Đã từ chối', status: 'REJECTED' as const },
    { label: 'Đã chờ duyệt', status: 'PENDING' as const },
  ];

  constructor(
    private eventsListService: EventsListService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.setupSearchSubscription();
    this.loadEvents();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchSubscription() {
    this.searchSubject
      //distinctUntilChanged() tránh search lại cùng 1 từ khóa ví dụ đã search 'sự kiện A' nếu xóa đi ghi lại 'sự kiện A' y hệt thì sẽ k search vì giống từ khóa cũ
      .pipe(debounceTime(600), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchQuery) => {
        this.searchQuery = searchQuery;
        this.currentPage = 1;
        this.loadEvents();
      });
  }

  async loadEvents() {
    const params: EventsListParams = {
      page: this.currentPage - 1,
      size: this.pageSize,
      status: this.tabs[this.selectedTab].status,
      search: this.searchQuery || undefined,
      sortBy: 'updatedDate',
      sortDirection: 'DESC',
    };

    this.loading.set(true);

    try {
      const response = await firstValueFrom(
        this.eventsListService.getEvents(params)
      );
      this.events = response.events;
      this.totalElements = response.totalElements;
      this.totalPages = response.totalPages;
      this.currentPage = response.currentPage + 1;
    } catch (error) {
      console.error('Error loading events:', error);
      this.events = []; // Still clear events on error
    } finally {
      this.loading.set(false);
    }
  }

  onTabChange(index: number) {
    this.selectedTab = index;
    this.currentPage = 1;
    this.loadEvents();
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadEvents();
    this.scrollToTop();
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0 });
  }

  onEventEdit(eventId: string) {
    this.router.navigate(['/organizer/edit-event/', eventId], {});
  }

  onEventDelete(eventId: string) {
    const event = this.events.find((e) => e.id === eventId);
    if (event) {
      this.eventToDelete = event;
      this.showDeleteDialog = true;
    }
  }

  confirmDelete() {
    if (!this.eventToDelete) return;

    this.isDeleting = true;

    this.eventsListService
      .deleteEvent(this.eventToDelete.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadEvents(); // Reload current page
          this.hideDeleteDialog();
        },
        error: (error) => {
          console.error('Error deleting event:', error);
          alert('Có lỗi xảy ra khi xóa sự kiện. Vui lòng thử lại.');
          this.isDeleting = false;
        },
      });
  }

  hideDeleteDialog() {
    this.showDeleteDialog = false;
    this.eventToDelete = null;
    this.isDeleting = false;
  }

  createNewEvent() {
    this.router.navigate(['/organizer/create-event']);
  }

  trackByEventId(index: number, event: Events): string {
    return event.id;
  }
}
