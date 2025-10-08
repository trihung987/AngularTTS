import {
  Component,
  OnInit,
  computed,
  signal,
  inject,
  DestroyRef,
  HostListener,
} from '@angular/core'; // THAY ĐỔI IMPORTS
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'; // MỚI: Để quản lý subscription
import {
  CommonModule,
  Location,
  CurrencyPipe,
  DatePipe,
} from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { of, timer } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ReservationService } from '../../services/reservation.service';
import { Reservation } from '../../../../shared/models/reservation.model';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { CanLeave } from '../../../../core/guard/can-deactive.guard';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-reservation-page',
  standalone: true,
  imports: [CommonModule, DatePipe, ConfirmDialog],
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.css'],
})
export class ReservationPageComponent implements OnInit, CanLeave {
  constructor(
    private reservationService: ReservationService,
    private orderService : OrderService,
    private toastrService: ToastrService,
    private location: Location,
    private router: Router,
    private route: ActivatedRoute,
    private destroyRef: DestroyRef,
    private confirmationService: ConfirmationService
  ) {}

  private resolveDeactivate!: (value: boolean) => void;

  reservation = signal<Reservation | null>(null);
  isExpired = signal(false);
  timeLeft = signal('--:--');
  timeProgress = signal(1);

  subtotal = computed(() => {
    const res = this.reservation();
    return res ? res.priceZone * res.quantity : 0;
  });
  statusText = computed(() =>
    this.isExpired() ? 'Hết hạn giữ chỗ' : 'Đang giữ chỗ'
  );

  ngOnInit(): void {
    // const state = this.location.getState() as { reservation: Reservation };
    // if (state && state.reservation) {
    //   this.setupReservation(state.reservation);
    // } else {
    const id = this.route.snapshot.paramMap.get('id');

    if (id == null) {
      this.reservationService
        .getReservationNow()
        .pipe(
          catchError((err) => {
            console.warn('Not found reservation:', err);
            return of(null);
          })
        )
        .subscribe((reservationId) => {
          if (reservationId) {
            this.loadReservation(reservationId);
          } else {
            this.handleInvalidReservation();
          }
        });
    } else {
      this.loadReservation(id);
    }
    //}
  }

  private loadReservation(id: string): void {
    this.reservationService.getReservationById(id).subscribe({
      next: (res) => this.setupReservation(res),
      error: () => {
        this.handleInvalidReservation();
      },
    });
  }

  private isExpredReal(): boolean {
    const res = this.reservation();
    if (!res) return true;
    const expiresAt = new Date(res.expiresAt).getTime();
    return expiresAt <= Date.now();
  }

  private setupReservation(reservation: Reservation): void {
    const expiresAt = new Date(reservation.expiresAt).getTime();
    if (expiresAt <= Date.now()) {
      this.handleInvalidReservation('Giữ chỗ đã hết hạn');
      return;
    }
    this.reservation.set(reservation); // Cập nhật signal
    this.startCountdown();
  }

  private startCountdown(): void {
    const res = this.reservation();
    if (!res) return;

    const expiresAt = new Date(res.expiresAt).getTime();
    const createdAt = new Date(res.createdAt).getTime();
    const totalDuration = Math.max(1, expiresAt - createdAt);

    timer(0, 250)
      .pipe(
        map(() => Math.max(0, expiresAt - Date.now())),
        // Tự động hủy subscription khi component destroy
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((remainingMs) => {
        // Cập nhật các signals, view sẽ tự động render lại
        this.updateTimer(remainingMs, totalDuration);

        if (remainingMs === 0 && !this.isExpired()) {
          this.isExpired.set(true);
        }
      });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  private updateTimer(remainingMs: number, totalDuration: number): void {
    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    this.timeLeft.set(`${this.pad(minutes)}:${this.pad(seconds)}`);
    this.timeProgress.set(remainingMs / totalDuration);
  }

  confirmPayment(): void {
    const res = this.reservation();
    if (!res || this.isExpired()) return;

    this.orderService.createOrder(res.id).subscribe({
      next: (order) => {
        this.toastrService.success(
          'Đang chuyển đến trang thanh toán...',
          'Thành công'
        );
        console.log('Redirecting to payment URL:', order);
        window.location.href = order.urlPayment;

      },
      error: (err) => {
        const errorMessage =
          err?.error?.message || 'Có lỗi xảy ra trong quá trình xác nhận.';
        this.toastrService.error(errorMessage, 'Khởi tạo thanh toán thất bại');
      },
    });
  }

  private handleInvalidReservation(
    message: string = 'Giữ chỗ không tồn tại hoặc đã hết hạn'
  ): void {
    this.toastrService.error(message, 'Lỗi');
    this.router.navigate(['/']);
  }

  goBack(): void {
    this.location.back();
  }

  private pad(num: number): string {
    return num.toString().padStart(2, '0');
  }

  // @HostListener('window:pagehide', ['$event'])
  // onPageHide(event: PageTransitionEvent) {
  //   if (!event.persisted) {
  //     this.cleanupReservation();
  //   }
  // }

  canDeactivate(): Promise<boolean> {
    if (this.reservation() === null || this.isExpired() || this.isExpredReal())
      return new Promise<boolean>((resolve) => resolve(true));

    return new Promise<boolean>((resolve) => {
      //wait for user confirmation
      this.resolveDeactivate = resolve;
      this.confirmationService.confirm({
        message: 'Bạn có chắc muốn rời trang? Dữ liệu giữ chỗ sẽ bị hủy.',
        header: 'Xác nhận rời trang',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.cleanupReservation();
          resolve(true); // cho phép đi
          this.toastrService.success(
            'Giữ chỗ đã được hủy thành công.',
            'Đã hủy'
          );
        },
        reject: () => {
          resolve(false); // hủy
          this.toastrService.info('Tiếp tục giữ chỗ của bạn.', 'Đang giữ chỗ');
        },
      });
    });
  }

  private cleanupReservation(): void {
    if (this.reservation() && !this.isExpired()) {
      this.reservationService
        .cancelReservation(this.reservation()!.id)
        .subscribe({
          next: () => {
            console.log('Hủy giữ chỗ thành công');
          },
          error: (error) => {
            console.error('Lỗi khi hủy giữ chỗ', error);
            this.toastrService.error(
              'Không thể hủy giữ chỗ. Vui lòng thử lại.',
              'Lỗi'
            );
          },
        });
    }
  }
}
