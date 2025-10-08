import { ReservationService } from './../../services/reservation.service';
import {
  HoldReservationRequest,
  Reservation,
} from './../../../../shared/models/reservation.model';
import { ToastrService } from 'ngx-toastr';
import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
  NgZone,
  HostListener,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { Events } from '../../../../shared/models/event.model';
import { Zone } from '../../../../shared/models/zone.model';
import { CreateEventService } from '../../../organizer/services/events.service';

@Component({
  selector: 'app-zone-select',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    InputNumberModule,
    FormsModule,
  ],
  templateUrl: './zone-select.component.html',
  styleUrls: ['./zone-select.component.css'],
})
export class ZoneSelectComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: false })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  // --- State của component ---
  event: Events | null = null;
  isLoading = signal(true);
  isHoldingTicket = signal(false);
  error: string | null = null;
  selectedZone: Zone | null = null;

  // --- Dialog properties ---
  showDialog = signal(false);
  ticketQuantity = 1;
  private dialogTimeout: any;

  // --- Các thuộc tính quản lý Canvas ---
  private zones: Zone[] = [];
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private resizeObserver!: ResizeObserver;

  private scale = 1;
  private panOffset = { x: 0, y: 0 };
  private isPanning = false;
  private lastPanPoint = { x: 0, y: 0 };
  private minZoom = 0.2;
  private maxZoom = 5;
  private wheelListener = this.onWheel.bind(this);

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private eventService: CreateEventService,
    private toastrService: ToastrService,
    private reservationService: ReservationService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone,
    private router: Router
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0 });
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.checkExistingReservation(id);
    } else {
      this.error = 'Không tìm thấy ID sự kiện.';
      this.isLoading.set(false);
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Canvas initialization will be handled in fetchEvent
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver && this.canvas) {
      this.resizeObserver.unobserve(this.canvas);
    }
    if (this.canvas) {
      this.canvas.removeEventListener('wheel', this.wheelListener);
    }
    if (this.dialogTimeout) {
      clearTimeout(this.dialogTimeout);
    }
  }

  checkExistingReservation(id: string): void {
    this.isLoading.set(true);
    this.reservationService
      .getReservationNow()
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.fetchEvent(id);
        }),
        catchError((err) => {
          console.warn('Not found reservation:', err);

          return of(null);
        })
      )
      .subscribe((reservationId) => {
        if (reservationId) {
          this.router.navigate(['/event-detail', id]);
        }
      });
  }

  fetchEvent(id: string): void {
    this.isLoading.set(true);
    this.eventService
      .getEventDetailsById(id)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        catchError((err) => {
          this.error = 'Không thể tải sơ đồ. Vui lòng thử lại.';
          console.error(err);
          return of(null);
        })
      )
      .subscribe((data) => {
        if (data) {
          this.event = data;
          this.zones = data.zones || [];

          if (this.getSellableZones().every(this.isZoneSoldOut)) {
            this.toastrService.error('Sự kiện này đã bán hết vé.');
            this.goBack();
            return;
          }
          if (this.isLateTime()) {
            this.toastrService.error(
              'Sự kiện này đã diễn ra.',
              'Không thể mua vé'
            );
            this.goBack();
            return;
          }

          setTimeout(() => this.initializeCanvas(), 0);
          localStorage.setItem('eventId', id);
        }
      });
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

  isZoneSoldOut(zone: Zone): boolean {
    return (zone.maxTickets ?? 0) - (zone.soldTickets ?? 0) <= 0;
  }

  goBack(): void {
    this.location.back();
  }

  getSellableZones(): Zone[] {
    return this.zones.filter((z) => z.isSellable);
  }

  selectAndHighlightZone(zone: Zone | null) {
    if (zone && this.isZoneSoldOut(zone)) {
      return;
    }

    this.selectedZone = zone;
    this.drawCanvas(); // Vẽ lại để cập nhật highlight

    if (zone && zone.isSellable) {
      this.ticketQuantity = 1; // Reset quantity
      this.showDialog.set(true);
    } else {
      this.showDialog.set(false);
    }
  }

  onDialogHide(): void {
    this.showDialog.set(false);
    this.selectedZone = null;
    this.drawCanvas();
  }

  confirmPurchase(): void {
    // 1. Kiểm tra các điều kiện cần thiết
    if (!this.selectedZone || !this.event?.id) {
      this.toastrService.error('Thông tin khu vực hoặc sự kiện không hợp lệ.');
      return;
    }

    const remainingTickets =
      (this.selectedZone.maxTickets ?? 0) -
      (this.selectedZone.soldTickets ?? 0);
    if (this.ticketQuantity > remainingTickets) {
      this.toastrService.error(
        `Chỉ còn ${remainingTickets} vé cho khu vực này.`
      );
      return;
    }

    this.isHoldingTicket.set(true);

    const request: HoldReservationRequest = {
      zoneId: this.selectedZone.id,
      quantity: this.ticketQuantity,
    };
    console.log('before reservation', request);
    this.reservationService
      .holdTickets(request)
      .pipe(
        finalize(() => {
          this.isHoldingTicket.set(false);
          this.onDialogHide(); // Đóng dialog dù thành công hay thất bại
        })
      )
      .subscribe({
        next: (reservation) => {
          this.toastrService.success('Đã giữ chỗ vé thành công!');
          this.router.navigate(['/reservation'], {
            state: { reservation }, // truyền state reservation qua page giữ chỗ
          });
          console.log('Đặt giữ chỗ thành công: ', reservation);
        },
        error: (err) => {
          const errorMessage =
            err.error?.message || 'Giữ vé thất bại, vui lòng thử lại.';
          this.toastrService.error(errorMessage, 'Lỗi khi xác nhận vé');
          this.goBack();
          console.error('Lỗi khi giữ vé:', err);
        },
      });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  getTotalPrice(): number {
    return this.selectedZone
      ? this.selectedZone.price * this.ticketQuantity
      : 0;
  }

  zoom(factor: number) {
    const newScale = Math.max(
      this.minZoom,
      Math.min(this.maxZoom, this.scale * factor)
    );
    const center = { x: this.canvas.width / 2, y: this.canvas.height / 2 };

    const mouseWorldBeforeX = (center.x - this.panOffset.x) / this.scale;
    const mouseWorldBeforeY = (center.y - this.panOffset.y) / this.scale;

    this.panOffset.x = center.x - mouseWorldBeforeX * newScale;
    this.panOffset.y = center.y - mouseWorldBeforeY * newScale;
    this.scale = newScale;

    this.drawCanvas();
  }

  resetView() {
    this.scale = 1;
    if (!this.canvas) return;

    const bounds = this.getZonesBounds();
    if (bounds.maxX - bounds.minX === 0 || bounds.maxY - bounds.minY === 0) {
      this.panOffset = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
    } else {
      const objectWidth = bounds.maxX - bounds.minX;
      const objectHeight = bounds.maxY - bounds.minY;

      const scaleX = this.canvas.width / objectWidth;
      const scaleY = this.canvas.height / objectHeight;
      this.scale = Math.min(scaleX, scaleY) * 0.9; // 90% view

      const scaledWidth = objectWidth * this.scale;
      const scaledHeight = objectHeight * this.scale;

      this.panOffset.x =
        (this.canvas.width - scaledWidth) / 2 - bounds.minX * this.scale;
      this.panOffset.y =
        (this.canvas.height - scaledHeight) / 2 - bounds.minY * this.scale;
    }

    this.drawCanvas();
  }

  @HostListener('window:resize')
  onResize() {
    this.resetView();
  }

  private onWheel(event: WheelEvent) {
    if (event.target !== this.canvas) return;
    event.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const mouseWorldBeforeX = (mouseX - this.panOffset.x) / this.scale;
    const mouseWorldBeforeY = (mouseY - this.panOffset.y) / this.scale;

    const zoomFactor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
    const newScale = Math.max(
      this.minZoom,
      Math.min(this.maxZoom, this.scale * zoomFactor)
    );

    this.panOffset.x = mouseX - mouseWorldBeforeX * newScale;
    this.panOffset.y = mouseY - mouseWorldBeforeY * newScale;
    this.scale = newScale;

    this.drawCanvas();
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    if (event.target !== this.canvas) return;

    // --- Logic chọn Zone ---
    const worldCoords = this.getMouseWorldCoordinates(event);
    const clickedZone = this.zones
      .slice()
      .reverse()
      .find((zone) => this.isPointInZone(worldCoords.x, worldCoords.y, zone));

    if (clickedZone && !this.isZoneSoldOut(clickedZone)) {
      this.selectAndHighlightZone(clickedZone);
    } else {
      this.selectAndHighlightZone(null);
    }

    // --- Logic kéo (Pan) ---
    this.isPanning = true;
    this.lastPanPoint = { x: event.clientX, y: event.clientY };
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (event.target !== this.canvas) return;

    const worldCoords = this.getMouseWorldCoordinates(event);
    const hoveredZone = this.zones
      .slice()
      .reverse()
      .find((zone) => this.isPointInZone(worldCoords.x, worldCoords.y, zone));

    if (
      hoveredZone &&
      (this.isZoneSoldOut(hoveredZone) || !hoveredZone.isSellable)
    ) {
      this.canvas.style.cursor = 'not-allowed';
    } else {
      this.canvas.style.cursor = this.isPanning ? 'grabbing' : 'grab';
    }

    if (this.isPanning) {
      const dx = event.clientX - this.lastPanPoint.x;
      const dy = event.clientY - this.lastPanPoint.y;
      this.panOffset.x += dx;
      this.panOffset.y += dy;
      this.lastPanPoint = { x: event.clientX, y: event.clientY };
      this.drawCanvas();
    }
  }

  @HostListener('mouseup')
  @HostListener('mouseleave')
  onMouseUp() {
    this.isPanning = false;
    if (this.canvas) {
      this.canvas.style.cursor = 'grab';
    }
  }

  private initializeCanvas(): void {
    if (!this.canvasRef?.nativeElement) return;

    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.canvas.addEventListener('wheel', this.wheelListener, {
      passive: false,
    });

    const parent = this.canvas.parentElement!;
    this.resizeObserver = new ResizeObserver(() => {
      const rect = parent.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
      this.resetView();
    });
    this.resizeObserver.observe(parent);
  }

  private drawCanvas() {
    if (!this.ctx) return;
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.translate(this.panOffset.x, this.panOffset.y);
    this.ctx.scale(this.scale, this.scale);

    this.zones.forEach((zone) => this.drawZoneShape(zone));

    if (this.selectedZone) {
      this.highlightSelectedZone(this.selectedZone);
    }

    this.ctx.restore();
  }

  private drawZoneShape(zone: Zone) {
    const coords = zone.coordinates;
    const center = this.getZoneCenter(zone);
    const isSoldOut = this.isZoneSoldOut(zone);

    this.ctx.save();
    this.ctx.translate(center.x, center.y);
    this.ctx.rotate(zone.rotation || 0);

    this.ctx.fillStyle =
      zone.isSellable && !isSoldOut ? zone.color + '80' : '#55555580';
    this.ctx.strokeStyle =
      zone.isSellable && !isSoldOut ? zone.color : '#888888';
    this.ctx.lineWidth = 2 / this.scale;

    switch (zone.shape) {
      case 'rectangle':
        const w = coords.width || 0;
        const h = coords.height || 0;
        this.ctx.fillRect(-w / 2, -h / 2, w, h);
        this.ctx.strokeRect(-w / 2, -h / 2, w, h);
        break;
      case 'circle':
        this.ctx.beginPath();
        this.ctx.arc(0, 0, coords.radius || 0, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();
        break;
      case 'polygon':
        if (coords.points && coords.points.length >= 3) {
          const pCenter = this.getZoneCenter({ ...zone, rotation: 0 });
          this.ctx.beginPath();
          this.ctx.moveTo(
            coords.points[0].x - pCenter.x,
            coords.points[0].y - pCenter.y
          );
          for (let i = 1; i < coords.points.length; i++) {
            this.ctx.lineTo(
              coords.points[i].x - pCenter.x,
              coords.points[i].y - pCenter.y
            );
          }
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();
        }
        break;
    }

    this.ctx.fillStyle = '#FFFFFF';
    const fontSize = 16 / this.scale;
    this.ctx.font = `bold ${fontSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    const label = zone.isSellable ? `${zone.name}` : zone.name;
    this.ctx.fillText(label, 0, 0);

    this.ctx.restore();
  }

  private highlightSelectedZone(zone: Zone) {
    const center = this.getZoneCenter(zone);
    this.ctx.save();
    this.ctx.translate(center.x, center.y);
    this.ctx.rotate(zone.rotation || 0);

    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 4 / this.scale;
    this.ctx.shadowColor = 'yellow';
    this.ctx.shadowBlur = 15;

    const coords = zone.coordinates;
    switch (zone.shape) {
      case 'rectangle':
        const w = coords.width || 0;
        const h = coords.height || 0;
        this.ctx.strokeRect(-w / 2, -h / 2, w, h);
        break;
      case 'circle':
        this.ctx.beginPath();
        this.ctx.arc(0, 0, coords.radius || 0, 0, 2 * Math.PI);
        this.ctx.stroke();
        break;
      case 'polygon':
        if (coords.points && coords.points.length >= 3) {
          const pCenter = this.getZoneCenter({ ...zone, rotation: 0 });
          this.ctx.beginPath();
          this.ctx.moveTo(
            coords.points[0].x - pCenter.x,
            coords.points[0].y - pCenter.y
          );
          for (let i = 1; i < coords.points.length; i++) {
            this.ctx.lineTo(
              coords.points[i].x - pCenter.x,
              coords.points[i].y - pCenter.y
            );
          }
          this.ctx.closePath();
          this.ctx.stroke();
        }
        break;
    }
    this.ctx.restore();
  }

  private getMouseWorldCoordinates(event: MouseEvent): {
    x: number;
    y: number;
  } {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    return {
      x: (canvasX - this.panOffset.x) / this.scale,
      y: (canvasY - this.panOffset.y) / this.scale,
    };
  }

  private isPointInZone(x: number, y: number, zone: Zone): boolean {
    const center = this.getZoneCenter(zone);
    const cos = Math.cos(-(zone.rotation || 0));
    const sin = Math.sin(-(zone.rotation || 0));
    const dx = x - center.x;
    const dy = y - center.y;
    const rotatedX = dx * cos - dy * sin + center.x;
    const rotatedY = dx * sin + dy * cos + center.y;

    const coords = zone.coordinates;
    switch (zone.shape) {
      case 'rectangle':
        return (
          rotatedX >= coords.x &&
          rotatedX <= coords.x + (coords.width || 0) &&
          rotatedY >= coords.y &&
          rotatedY <= coords.y + (coords.height || 0)
        );
      case 'circle':
        const dist = Math.sqrt(
          Math.pow(rotatedX - coords.x, 2) + Math.pow(rotatedY - coords.y, 2)
        );
        return dist <= (coords.radius || 0);
      case 'polygon':
        if (!coords.points || coords.points.length < 3) return false;
        return this.isPointInPolygon(rotatedX, rotatedY, coords.points);
    }
    return false;
  }

  private isPointInPolygon(
    x: number,
    y: number,
    points: { x: number; y: number }[]
  ): boolean {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x,
        yi = points[i].y;
      const xj = points[j].x,
        yj = points[j].y;
      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  private getZoneCenter(zone: Zone): { x: number; y: number } {
    const coords = zone.coordinates;
    switch (zone.shape) {
      case 'rectangle':
        return {
          x: coords.x + (coords.width || 0) / 2,
          y: coords.y + (coords.height || 0) / 2,
        };
      case 'circle':
        return { x: coords.x, y: coords.y };
      case 'polygon':
        if (coords.points && coords.points.length > 0) {
          const sumX = coords.points.reduce((sum, p) => sum + p.x, 0);
          const sumY = coords.points.reduce((sum, p) => sum + p.y, 0);
          return {
            x: sumX / coords.points.length,
            y: sumY / coords.points.length,
          };
        }
        return { x: coords.x, y: coords.y };
    }
    return { x: coords.x, y: coords.y };
  }

  private getZonesBounds(): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } {
    if (this.zones.length === 0) return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    this.zones.forEach((zone) => {
      const c = zone.coordinates;
      const box = this.getZoneBoundingBox(zone);
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    });
    return { minX, minY, maxX, maxY };
  }

  private getZoneBoundingBox(zone: Zone): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const coords = zone.coordinates;
    switch (zone.shape) {
      case 'rectangle':
        return {
          x: coords.x,
          y: coords.y,
          width: coords.width || 0,
          height: coords.height || 0,
        };
      case 'circle':
        const r = coords.radius || 0;
        return {
          x: coords.x - r,
          y: coords.y - r,
          width: 2 * r,
          height: 2 * r,
        };
      case 'polygon':
        if (!coords.points || coords.points.length === 0) {
          return { x: coords.x, y: coords.y, width: 0, height: 0 };
        }
        const minX = Math.min(...coords.points.map((p) => p.x));
        const minY = Math.min(...coords.points.map((p) => p.y));
        const maxX = Math.max(...coords.points.map((p) => p.x));
        const maxY = Math.max(...coords.points.map((p) => p.y));
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    return { x: 0, y: 0, width: 0, height: 0 };
  }
}
