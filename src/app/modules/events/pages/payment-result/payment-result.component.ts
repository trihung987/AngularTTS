import { Component, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  trigger,
  state,
  style,
  transition,
  animate,
  keyframes,
} from '@angular/animations';
import { CommonModule, Location } from '@angular/common';
import { Order, OrderStatus } from '../../../../shared/models/order.model';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-result.component.html',
  styleUrls: ['./payment-result.component.css'],
  imports: [CommonModule],
  animations: [
    trigger('slideIn', [
      state('in', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('void => *', [
        style({ opacity: 0, transform: 'translateY(50px)' }),
        animate('0.6s ease-out'),
      ]),
    ]),
    trigger('checkmark', [
      state('in', style({ transform: 'scale(1)' })),
      transition('void => *', [
        style({ transform: 'scale(0)' }),
        animate('0.5s 0.3s ease-out'),
      ]),
    ]),
    trigger('orderIdGlow', [
      transition('void => *', [
        animate(
          '0.5s 0.8s ease-out',
          keyframes([
            style({ transform: 'scale(0.95)', offset: 0 }),
            style({ transform: 'scale(1)', offset: 1 }),
          ])
        ),
      ]),
    ]),
  ],
})
export class PaymentSuccessComponent implements OnInit {
  animationState = 'in';
  particles: { x: number; y: number; delay: number }[] = [];

  // Signals
  isValidating = signal<boolean>(true);
  validationError = signal<string | null>(null);
  paymentStatus = signal<OrderStatus | null>(null);
  orderId = signal<string | null>(null);
  totalAmount = signal<number | null>(null);
  eventId = signal<string | null>(null);

  constructor(
    private router: Router,
    private location: Location,
    private route: ActivatedRoute,
    private orderService: OrderService
  ) {}

  ngOnInit() {
    // Lấy eventId từ localStorage
    const storedEventId = localStorage.getItem('eventId');
    if (storedEventId) {
      this.eventId.set(storedEventId);
    }

    // Lấy tất cả query params từ URL
    this.route.queryParams.subscribe((params) => {
      console.log('Query params:', params);

      if (params && Object.keys(params).length > 0) {
        // Lấy Order ID từ vnp_TxnRef
        if (params['vnp_TxnRef']) {
          this.orderId.set(params['vnp_TxnRef']);
        }

        // Lấy số tiền từ vnp_Amount (VNPay trả về số tiền x 100)
        if (params['vnp_Amount']) {
          const amount = parseInt(params['vnp_Amount']) / 100;
          this.totalAmount.set(amount);
        }

        // Gọi API xác thực thanh toán
        this.validatePayment(params);
      } else {
        this.isValidating.set(false);
        this.validationError.set('Không tìm thấy thông tin giao dịch');
        this.paymentStatus.set(OrderStatus.FAILED);
      }
    });
  }

  validatePayment(params: { [key: string]: string }) {
    this.isValidating.set(true);
    this.validationError.set(null);

    this.orderService.validPaymentReturn(params).subscribe({
      next: (status) => {
        this.isValidating.set(false);

        if (status === null || status === undefined) {
          // Nếu nhận null thì hiện xác thực giao dịch thất bại
          this.validationError.set('Xác thực giao dịch thất bại');
          this.paymentStatus.set(OrderStatus.FAILED);

          setTimeout(() => {
            this.goToHome();
          }, 3000);
        } else if (status === OrderStatus.COMPLETED) {
          this.paymentStatus.set(OrderStatus.COMPLETED);
          this.generateParticles();
        } else if (status === OrderStatus.FAILED) {
          this.paymentStatus.set(OrderStatus.FAILED);
          this.validationError.set('Thanh toán thất bại');

          setTimeout(() => {
            this.goToHome();
          }, 3000);
        }
      },
      error: (error) => {
        console.error('Validation error:', error);
        this.isValidating.set(false);
        this.validationError.set('Có lỗi xảy ra khi xác thực giao dịch');
        this.paymentStatus.set(OrderStatus.FAILED);

        setTimeout(() => {
          this.goToHome();
        }, 3000);
      },
    });
  }

  generateParticles() {
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        delay: Math.random() * 3000,
      });
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  goToHome() {
    this.router.navigate(['/']);
  }

  goToMyTickets() {
    this.router.navigate(['/profile/my-tickets']);
  }

  continueBuyingTickets() {
    const eventId = this.eventId();
    if (eventId) {
      this.router.navigate(['/event-detail', eventId, 'zone-select']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
