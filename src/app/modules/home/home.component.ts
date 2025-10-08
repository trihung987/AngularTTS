import { AuthService } from './../auth/services/auth.service';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  Component,
  OnInit,
  ViewEncapsulation,
  OnDestroy,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { StorageWrapperService } from '../../shared/services/storage-wrapper.service';

import { Events } from '../../shared/models/event.model';
import {
  EventsListParams,
  EventsListResponse,
} from '../../shared/models/events-list.model';
import { Subject, interval, takeUntil, filter } from 'rxjs';

// PrimeNG Imports
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { CreateEventService } from '../organizer/services/events.service';
import { EventService } from '../events/services/event-list.service';
import { ScrollTopModule, ScrollTop } from 'primeng/scrolltop';

// Interface đã được cập nhật, loại bỏ thuộc tính 'icon'
interface Feature {
  title: string;
  description: string;
}

// Thêm interface cho category để code chặt chẽ hơn
interface Category {
  name: string;
  icon: string;
  gradient: string;
}

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CarouselModule,
    ButtonModule,
    TagModule,
    SkeletonModule,
    ScrollTop,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private eventService: EventService,
    private createEventService: CreateEventService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFeaturedEvents();
    this.loadLargeCapacityEvents();
    this.loadEventCategories();
    this.startBannerRotation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  searchQuery = '';
  isLoading = signal(false);
  isBannerLoading = signal(false);

  featuredEvents: Events[] = [];
  largeCapacityEvents: Events[] = [];
  bannerEvents = signal<Events[]>([]);
  currentBannerIndex = 0;

  categories = signal<Category[]>([]);
  carouselNumVisible = signal<number>(3);

  carouselResponsiveOptions = [
    { breakpoint: '1199px', numVisible: 3, numScroll: 1 },
    { breakpoint: '991px', numVisible: 2, numScroll: 1 },
    { breakpoint: '767px', numVisible: 1, numScroll: 1 },
  ];

  // Mảng features đã được cập nhật, không còn chứa mã SVG
  features: Feature[] = [
    {
      title: 'Thanh toán an toàn',
      description:
        'Hệ thống thanh toán được mã hóa với SSL, hỗ trợ đa dạng phương thức thanh toán online.',
    },
    {
      title: 'Check-in QR Code',
      description:
        'Vé điện tử với mã QR, check-in nhanh chóng và chống giả mạo hiệu quả.',
    },
    {
      title: 'Real-time Updates',
      description:
        'Cập nhật thông tin sự kiện, số lượng vé còn lại và thông báo quan trọng theo thời gian thực.',
    },
    {
      title: 'Tìm kiếm thông minh',
      description:
        'Công cụ tìm kiếm AI giúp gợi ý sự kiện phù hợp với sở thích và vị trí của bạn.',
    },
    {
      title: 'Quản lý dễ dàng',
      description:
        'Dashboard trực quan cho ban tổ chức, theo dõi doanh thu và quản lý người tham gia.',
    },
    {
      title: 'Hỗ trợ 24/7',
      description:
        'Đội ngũ hỗ trợ khách hàng chuyên nghiệp, sẵn sàng giải đáp mọi thắc mắc của bạn.',
    },
  ];

  loadFeaturedEvents(): void {
    this.isLoading.set(true);
    const params: EventsListParams = {
      page: 0,
      size: 3,
      sortBy: 'startDate',
      sortDirection: 'ASC'
    };
    this.eventService
      .getEvents(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: EventsListResponse) => {
          this.featuredEvents = response.events || [];
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading featured events:', error);
          this.isLoading.set(false);
        },
      });
  }

  updateCarouselVisibility(): void {
    const eventCount = this.largeCapacityEvents.length;
    // Nếu có sự kiện, lấy số nhỏ hơn giữa số sự kiện và 3.
    // Nếu không có sự kiện nào, đặt mặc định là 3 để tránh lỗi.
    this.carouselNumVisible.set(eventCount > 0 ? Math.min(eventCount, 3) : 3);
    console.log('visble: ', this.carouselNumVisible(), eventCount);
  }

  loadLargeCapacityEvents(): void {
    const params: EventsListParams = {
      page: 0,
      size: 6,
    };
    this.eventService
      .getEvents(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: EventsListResponse) => {
          this.largeCapacityEvents = response.events || [];
          this.updateCarouselVisibility();
        },
        error: (error) => {
          console.error('Error loading large capacity events:', error);
          this.updateCarouselVisibility();
        },
      });
  }

  loadEventCategories(): void {
    this.createEventService
      .getEventCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories: string[]) => {
          const mappedCategories = categories.map((category, index) => ({
            name: category,
            icon: this.getCategoryIcon(category),
            gradient: this.getCategoryGradient(index),
          }));
          this.categories.set(mappedCategories);
        },
        error: (error) => {
          console.error('Error loading categories:', error);
        },
      });
  }

  loadBannerEvents(): void {
    this.isBannerLoading.set(true);
    const params: EventsListParams = {
      page: 0,
      size: 5,
      sortBy: 'startDate',
      sortDirection: 'ASC',
    };
    this.eventService
      .getEvents(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: EventsListResponse) => {
          const banner =
            response.events?.filter((event) => event.eventBanner) || [];
          this.isBannerLoading.set(false);
          this.bannerEvents.set(banner);
        },
        error: (error) => {
          console.error('Error loading banner events:', error);
          this.isBannerLoading.set(false);
        },
      });
  }

  startBannerRotation(): void {
    this.loadBannerEvents();
    interval(4000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.bannerEvents().length > 0) {
          this.currentBannerIndex =
            (this.currentBannerIndex + 1) % this.bannerEvents().length;
        }
      });
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      const queryParams = {
        search: this.searchQuery,
      };
      this.router.navigate(['/events'], { queryParams });
    }
  }

  onEnterSearch(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }

  onBookEvent(event: Events): void {
    console.log('Booking event:', event.id);
    // alert(`Đặt vé cho sự kiện: ${event.eventName}`);
    this.router.navigate(['/event-detail/', event.id]);
  }

  onViewAllEvents(): void {
    this.router.navigate(['/events']);
  }

  onCategoryClick(categoryName: string): void {
    const queryParams = {
      category: categoryName,
    };
    this.router.navigate(['/events'], { queryParams });
  }

  onBannerClick(event: Events): void {
    // console.log('Banner event clicked:', event.id);
    // alert(`Xem chi tiết sự kiện: ${event.eventName}`);
    this.router.navigate(['/event-detail/', event.id]);
  }

  nextBanner(): void {
    if (this.bannerEvents().length > 1) {
      this.currentBannerIndex =
        (this.currentBannerIndex + 1) % this.bannerEvents().length;
        console.log("banner size: ", this.currentBannerIndex, this.bannerEvents().length);
    }
  }

  prevBanner(): void {
    if (this.bannerEvents().length > 0) {
      this.currentBannerIndex =
        this.currentBannerIndex === 0
          ? this.bannerEvents().length - 1
          : this.currentBannerIndex - 1;
    }
  }

  setBannerIndex(index: number): void {
    this.currentBannerIndex = index;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    return this.createEventService.urlImg(imagePath);
  }

  getTotalSeats(event: Events): number {
    return (
      event.zones?.reduce((total, zone) => total + (zone.maxTickets || 0), 0) ||
      0
    );
  }

  // Đã thêm icon cho "Hội thảo"
  public getCategoryIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      'Âm nhạc': '🎵',
      'Hội thảo': '🎤',
      'Công nghệ': '💻',
      'Thể thao': '⚽',
      'Kinh doanh': '💼',
      'Giáo dục': '📚',
      'Ẩm thực': '🍜',
      'Nghệ thuật': '🎨',
      'Du lịch': '✈️',
      'Sức khỏe': '🏥',
      Khác: '📅',
    };
    return iconMap[category] || '📅';
  }

  private getCategoryGradient(index: number): string {
    const gradients = [
      'from-pink-500 to-red-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-teal-500',
      'from-purple-500 to-indigo-500',
      'from-yellow-500 to-orange-500',
      'from-red-500 to-pink-500',
    ];
    return gradients[index % gradients.length];
  }

  trackByEventId(index: number, event: Events): string {
    return event.id;
  }
}
