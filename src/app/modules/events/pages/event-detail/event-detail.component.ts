import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';


import { CreateEventService } from '../../../organizer/services/events.service';
import { Events } from '../../../../shared/models/event.model';
import { Zone } from '../../../../shared/models/zone.model';
import { ReservationService } from '../../services/reservation.service';
import { Dialog } from "primeng/dialog";
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, Dialog, DialogModule, ButtonModule],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.css'],
})
export class EventDetailComponent implements OnInit {
  event: Events | null = null;
  isLoading = signal(true); // Sử dụng signal để quản lý trạng thái loading
  isDescriptionExpanded = signal(false);
  error: string | null = null;

  // dialog
  showReservationDialog = signal(false);
  existingReservation: string | null = null;
  isCheckingReservation = signal(false);
  isCancellingReservation = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: CreateEventService, // Service để gọi API
    private toastrService: ToastrService, // Service để hiển thị thông báo
    private reservationService: ReservationService
  ) {}

  ngOnInit(): void {
    // Lấy ID của sự kiện từ URL
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEvent(id);
      //check reservation
      this.checkExistingReservation();
    } else {
      this.error = 'Không tìm thấy ID sự kiện.';
      this.isLoading.set(false);
      this.toastrService.error('ID sự kiện không hợp lệ.', 'Lỗi');
      this.router.navigate(['/']);
    }
  }

  checkExistingReservation(): void {
    this.isCheckingReservation.set(true);

    this.reservationService
      .getReservationNow()
      .pipe(
        finalize(() => this.isCheckingReservation.set(false)),
        catchError((err) => {
          console.warn('Not found reservation:', err);
          return of(null);
        })
      )
      .subscribe((reservationId) => {
        if (reservationId) {
          this.existingReservation = reservationId;
          this.showReservationDialog.set(true);
        }
      });
  }

  continueReservation(): void {
    if (this.existingReservation && this.event) {
      this.showReservationDialog.set(false);

      this.router.navigate(
        ['/reservation', this.existingReservation],
        {}
      );

      this.toastrService.info('Đang tiếp tục đặt vé của bạn...', 'Thông báo');
    }
  }

  cancelExistingReservation(): void {
    if (!this.existingReservation) {
      return;
    }

    this.isCancellingReservation.set(true);

    this.reservationService
      .cancelReservation(this.existingReservation)
      .pipe(
        finalize(() => {
          this.isCancellingReservation.set(false);
          this.showReservationDialog.set(false);
        }),
        catchError((err) => {
          console.error('Error cancelling reservation:', err);
          this.toastrService.error(
            'Không thể hủy đặt vé. Vui lòng thử lại.',
            'Lỗi'
          );
          return of(undefined);
        })
      )
      .subscribe(() => {
        this.existingReservation = null;
        this.toastrService.success('Đã hủy đặt vé trước đó.', 'Thành công');
      });
  }

  loadEvent(id: string): void {
    this.isLoading.set(true);
    this.eventService
      .getEventDetailsById(id)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        catchError((err) => {
          this.error = 'Không thể tải dữ liệu sự kiện. Vui lòng thử lại sau.';
          console.error(err);
          this.toastrService.error(this.error, 'Lỗi');
          return of(null); // Trả về Observable rỗng để subscribe không bị lỗi
        })
      )
      .subscribe((data) => {
        if (data) {
          const processedEvent: any = { ...data };

          // Chuyển đổi các đường dẫn ảnh tương đối thành tuyệt đối
          if (data.eventImage) {
            processedEvent.eventImage = this.eventService.urlImg(
              data.eventImage as string
            );
          }
          if (data.eventBanner) {
            processedEvent.eventBanner = this.eventService.urlImg(
              data.eventBanner as string
            );
          }
          if (data.organizer?.logo) {
            processedEvent.organizer.logo = this.eventService.urlImg(
              data.organizer.logo as string
            );
          }

          this.event = processedEvent as Events;
        } else {
          this.error = 'Không tìm thấy sự kiện.';
          this.toastrService.warning(this.error, 'Thông báo');
        }
      });
  }

  getSellableZones(): Zone[] {
    return this.event?.zones.filter((z) => z.isSellable) || [];
  }

  isZoneSoldOut(zone: Zone): boolean {
    return (zone.maxTickets ?? 0) - (zone.soldTickets ?? 0) <= 0;
  }

  isAllSoldOut(): boolean {
    const sellableZones = this.getSellableZones();
    return sellableZones.every((zone) => this.isZoneSoldOut(zone));
  }

  getMinPrice(): number {
    if (!this.event || !this.event.zones) return 0;
    const sellableZones = this.event.zones.filter(
      (z) => z.isSellable && z.price > 0
    );
    if (sellableZones.length === 0) return 0;
    return Math.min(...sellableZones.map((z) => z.price));
  }

  // Điều hướng đến trang chọn khu vực (zone selection).

  navigateToZoneSelection(): void {
    if (this.event) {
      this.router.navigate(['/event-detail', this.event.id, 'zone-select']);
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  toggleDescription(): void {
    this.isDescriptionExpanded.set(!this.isDescriptionExpanded());
  }

  navigateToEvent(eventId: string): void {
    this.router.navigate(['/events', eventId]);
  }

  viewMoreEvents(): void {
    this.router.navigate(['/events']);
  }
}
