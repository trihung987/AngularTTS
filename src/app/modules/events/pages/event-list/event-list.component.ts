import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  takeUntil,
  finalize,
} from 'rxjs';
import { Events } from '../../../../shared/models/event.model';
import { EventService } from '../../services/event-list.service';
import {
  EventsListParams,
  EventsListResponse,
} from '../../../../shared/models/events-list.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { CreateEventService } from '../../../organizer/services/events.service';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { EventCardComponent } from '../../components/event-card/event-card.component';
import { SelectModule } from 'primeng/select';
import { OverlayModule } from 'primeng/overlay';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EventsPaginationComponent } from "../../../organizer/components/events-pagination/events-pagination.component";

export type SortOption =
  | 'eventName'
  | 'startDate'
  | 'totalRevenue'
  | 'totalSeats'
  | 'updatedDate';
export type SortDirection = 'ASC' | 'DESC';

export interface EventCategory {
  value: string;
  label: string;
}

export interface SortOptionConfig {
  value: SortOption;
  label: string;
  directions: { value: SortDirection; label: string }[];
}

interface PaginatorEvent {
  first?: number;
  rows?: number;
  page?: number;
  pageCount?: number;
}

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.css'],
  imports: [
    FormsModule,
    CommonModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    PaginatorModule,
    ProgressSpinnerModule,
    SelectModule,
    OverlayModule,
    TooltipModule,
    EventCardComponent,
    MatProgressSpinnerModule,
    EventsPaginationComponent,
  ],
})
export class EventListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  events: Events[] = [];
  currentPage = 0;
  pageSize = 12;
  totalElements = 0;
  totalPages = 0;
  isLoading = signal(true);
  currentView: 'grid' | 'list' = 'grid';

  // Filter options
  searchTerm = '';
  selectedCategory = '';
  selectedSort: SortOption = 'startDate';
  selectedSortDirection: SortDirection = 'ASC';

  categories: EventCategory[] = [
    { value: '', label: 'Tất cả danh mục' },
    { value: 'Âm nhạc', label: 'Âm nhạc' },
    { value: 'Thể thao', label: 'Thể thao' },
    { value: 'Công nghệ', label: 'Công nghệ' },
    { value: 'Kinh doanh', label: 'Kinh doanh' },
    { value: 'Nghệ thuật', label: 'Nghệ thuật' },
    { value: 'Ẩm thực', label: 'Ẩm thực' },
    { value: 'Giáo dục', label: 'Giáo dục' },
    { value: 'Sức khỏe', label: 'Sức khỏe' },
    { value: 'Du lịch', label: 'Du lịch' },
  ];

  sortOptions: SortOptionConfig[] = [
    {
      value: 'startDate',
      label: 'Ngày bắt đầu',
      directions: [
        { value: 'ASC', label: 'Sớm nhất' },
        { value: 'DESC', label: 'Muộn nhất' },
      ],
    },
    {
      value: 'updatedDate',
      label: 'Ngày cập nhật',
      directions: [
        { value: 'DESC', label: 'Mới nhất' },
        { value: 'ASC', label: 'Cũ nhất' },
      ],
    },
    {
      value: 'eventName',
      label: 'Tên sự kiện',
      directions: [
        { value: 'ASC', label: 'A-Z' },
        { value: 'DESC', label: 'Z-A' },
      ],
    },
    {
      value: 'totalSeats',
      label: 'Số chỗ ngồi',
      directions: [
        { value: 'DESC', label: 'Nhiều nhất' },
        { value: 'ASC', label: 'Ít nhất' },
      ],
    },
  ];

  constructor(
    private eventService: EventService,
    private createEventService: CreateEventService,
    private toastr: ToastrService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  // ngOnInit(): void {
  //   //this.setupSearch();
  //   this.loadEvents();
  // }

  ngOnInit(): void {
    window.scrollTo({ top: 0 });
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.searchTerm = params['search'] || '';
        this.selectedCategory = params['category'] || '';
        this.currentPage = params['page'] ? Number(params['page']) : 0;
        this.selectedSort = (params['sortBy'] as SortOption) || 'startDate';
        this.selectedSortDirection =
          (params['sortDirection'] as SortDirection) || 'ASC';

        this.validateSortDirection();
        this.loadEvents();
      });
  }

  //Kiểm tra xem option sort có chính xác tồn tại không
  private validateSortDirection(): void {
    const selectedOption = this.sortOptions.find(
      (opt) => opt.value === this.selectedSort
    );
    if (selectedOption) {
      const isValidDirection = selectedOption.directions.some(
        (dir) => dir.value === this.selectedSortDirection
      );
      if (!isValidDirection) {
        this.selectedSortDirection = selectedOption.directions[0].value;
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  // onEnterSearch(): void {
  //   if (this.isLoading()) {
  //     return;
  //   }
  //   this.currentPage = 0;
  //   this.loadEvents();
  // }

  onEnterSearch(): void {
    if (this.isLoading()) return;

    const queryParams = {
      search: this.searchTerm || null,
      category: this.selectedCategory || null,
      sortBy: this.selectedSort,
      sortDirection: this.selectedSortDirection,
      page: 0,
    };

    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.code === 'Enter') {
      this.onEnterSearch();
    }
  }

  //gõ xong tự search luôn
  // private setupSearch(): void {
  //   this.searchSubject
  //     .pipe(debounceTime(800), distinctUntilChanged(), takeUntil(this.destroy$))
  //     .subscribe((searchTerm) => {
  //       this.searchTerm = searchTerm;
  //       this.currentPage = 0;
  //       this.loadEvents();
  //     });
  // }

  private loadEvents(): void {
    this.isLoading.set(true);

    var params: EventsListParams = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.selectedSort,
      sortDirection: this.selectedSortDirection,
    };
    if (params.sortBy === 'startDate') {
      params.validateDate = true;
    }else {
      params.validateDate = false;
    }

    if (this.searchTerm.trim()) {
      params.search = this.searchTerm.trim();
    }

    this.eventService
      .getEvents(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response: EventsListResponse) => {
          let filteredEvents = response.events;
          if (this.selectedCategory) {
            filteredEvents = response.events.filter(
              (event) => event.eventCategory === this.selectedCategory
            );
          }

          this.events = filteredEvents;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
          this.currentPage = response.currentPage;
        },
        error: (error) => {
          console.error('Error loading events:', error);
          this.events = [];
          this.totalElements = 0;
          this.totalPages = 0;
          this.toastr.error('Có lỗi xảy ra khi tải sự kiện', 'Lỗi');
        },
      });
  }

  // onSearch(event: Event) {
  //   const target = event.target as HTMLInputElement;
  //   this.searchSubject.next(target.value);
  // }

  onFilterChange(): void {
    // When sort option changes, reset direction to default
    this.validateSortDirection();

    const queryParams = {
      search: this.searchTerm || null,
      category: this.selectedCategory || null,
      sortBy: this.selectedSort,
      sortDirection: this.selectedSortDirection,
      page: 0, // Reset to first page on any filter change
    };

    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams,
      queryParamsHandling: 'merge', // Keeps other params
    });
  }

  onPageChange(page: number): void {
    page = page - 1;
    this.router.navigate([], {
      relativeTo: this.activatedRoute, //giữ nguyên gốc url ban đầu (/events) mà k thay đổi về /
      queryParams: { page },
      queryParamsHandling: 'merge', //giữ lại query params cũ, chỉ merge (ghi đè nếu trùng key) với query params mới.
    });
    this.scrollToTop();
  }

  clearFilters(): void {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
    });
  }

  // clearFilters(): void {
  //   this.searchTerm = '';
  //   this.selectedCategory = '';
  //   this.selectedSort = 'startDate';
  //   this.selectedSortDirection = 'ASC';
  //   this.currentPage = 1;
  //   this.loadEvents();
  // }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.selectedCategory);
  }

  // onPageChange(page: number) {
  //   this.currentPage = page - 1;
  //   this.loadEvents();
  //   this.scrollToTop();
  // }

  onCategoryChange(): void {
    this.currentPage = 0;
    this.loadEvents();
  }

  onSortChange(): void {
    // Reset sort direction to default when changing sort option
    const selectedOption = this.sortOptions.find(
      (opt) => opt.value === this.selectedSort
    );
    if (selectedOption && selectedOption.directions.length > 0) {
      this.selectedSortDirection = selectedOption.directions[0].value;
    }
    this.currentPage = 0;
    this.loadEvents();
  }

  onSortDirectionChange(): void {
    this.currentPage = 0;
    this.loadEvents();
  }

  // onPageChange(event: PaginatorEvent): void {
  //   this.currentPage = event.page || 0;
  //   this.loadEvents();
  //   this.scrollToTop();
  // }

  toggleView(view: 'grid' | 'list'): void {
    this.currentView = view;
    if (view === 'list') {
      this.toastr.info(
        'Chế độ xem danh sách sẽ được cập nhật sớm!',
        'Thông báo'
      );
    }
  }

  getCategoryLabel(categoryValue: string): string {
    const category = this.categories.find((cat) => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  }

  get currentSortDirections() {
    const option = this.sortOptions.find(
      (opt) => opt.value === this.selectedSort
    );
    return option ? option.directions : [];
  }

  bookEvent(event: Events): void {
    console.log('Viewing event details:', event);

    this.router.navigate(['/event-detail/', event.id]);
  }

  goBack(): void {
    this.router.navigate(['/']);
    this.toastr.info('Chuyển về trang chủ...', 'Thông báo');
  }

  trackByEventId(index: number, event: Events): string {
    return event.id;
  }

  private scrollToTop(): void {
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  }

  getImg(url: string): string | null {
    if (!url) return null;
    return this.createEventService.urlImg(url);
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = this.getDefaultImage();
  }

  getDefaultImage(): string {
    return 'assets/images/notfoundimg.webp';
  }

  formatPrice(zones: any[]): string {
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

  formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  formatDateTime(dateStr: string, timeStr: string): string {
    try {
      return `${this.formatDate(dateStr)} - ${timeStr}`;
    } catch {
      return `${dateStr} - ${timeStr}`;
    }
  }

  getAvailableSeats(zones: any[]): number {
    if (!zones || zones.length === 0) return 0;
    return zones.reduce(
      (total, zone) => total + (zone.availableTickets || 0),
      0
    );
  }

  getTotalSeats(zones: any[]): number {
    if (!zones || zones.length === 0) return 0;
    return zones.reduce((total, zone) => total + (zone.capacity || 0), 0);
  }

  // Helper to get the label for the selected sort option
  getSelectedSortLabel(): string {
    const option = this.sortOptions.find(
      (opt) => opt.value === this.selectedSort
    );
    return option ? option.label : 'Sắp xếp theo';
  }

  // Helper to get the label for the selected sort direction
  getSelectedSortDirectionLabel(): string {
    const direction = this.currentSortDirections.find(
      (dir) => dir.value === this.selectedSortDirection
    );
    return direction ? direction.label : 'Thứ tự';
  }
}
