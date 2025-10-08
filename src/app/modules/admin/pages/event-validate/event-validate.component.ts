import { ToastrService } from 'ngx-toastr';
import {
  Component,
  OnInit,
  signal,
  ElementRef,
  ViewChild,
  HostListener,
} from '@angular/core';
import { Events } from '../../../../shared/models/event.model';
import { EventConfirmService } from '../../services/event-validate.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateEventService } from '../../../organizer/services/events.service';

// PrimeNG
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-event-validate',
  standalone: true,
  templateUrl: './event-validate.component.html',
  styleUrls: ['./event-validate.component.css'],
  imports: [CommonModule, FormsModule, ConfirmDialogModule, ButtonModule],
  providers: [ConfirmationService],
})
export class EventValidateComponent implements OnInit {
  @ViewChild('reviewCanvas', { static: false })
  reviewCanvasRef!: ElementRef<HTMLCanvasElement>;

  // Raw data
  events: Events[] = [];
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  searchQuery = '';

  // Signals for UI state
  isLoading = signal(false);
  isDialogOpen = signal(false);

  // Dialog/UI state
  selectedEvent: Events | null = null;
  activeTab: 'info' | 'zones' | 'bank' = 'info';
  selectedZone: any = null;

  // Canvas drawing state (review dialog)
  private rCanvas?: HTMLCanvasElement;
  private rCtx?: CanvasRenderingContext2D;
  private rScale = 1;
  private rOffset = { x: 0, y: 0 };
  private resizeObserver?: ResizeObserver;

  // Bind once for add/removeEventListener
  private onReviewCanvasClick = (e: MouseEvent) => this.handleCanvasClick(e);

  constructor(
    private eventConfirmService: EventConfirmService,
    private createEventService: CreateEventService,
    private toastrService: ToastrService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  // ---------- Data loading ----------
  loadEvents(): void {
    this.isLoading.set(true);
    const params = {
      page: this.currentPage,
      size: this.pageSize,
      search: this.searchQuery || undefined,
      sortBy: 'updatedDate',
      sortDirection: 'DESC' as const,
      validateDate: true,
    };

    this.eventConfirmService.getPendingEvents(params).subscribe({
      next: (response) => {
        this.events = response.events;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.currentPage = response.currentPage;
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.isLoading.set(false);
      },
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadEvents();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadEvents();
  }

  // ---------- Dialog controls ----------
  openDialog(event: Events): void {
    this.selectedEvent = event;
    this.isDialogOpen.set(true);
    this.activeTab = 'info';
    this.selectedZone = null;
    // Canvas will be initialized when switching to zones tab
  }

  closeDialog(): void {
    this.isDialogOpen.set(false);
    this.teardownReviewCanvas();
    this.selectedEvent = null;
    this.selectedZone = null;
  }

  switchTab(tab: 'info' | 'zones' | 'bank'): void {
    this.activeTab = tab;
    if (tab === 'zones') {
      // Defer to allow template to render the canvas
      setTimeout(() => this.initReviewCanvas(), 0);
    }
  }

  // ---------- Canvas init/draw (review dialog) ----------
  private initReviewCanvas(): void {
    if (!this.reviewCanvasRef || !this.selectedEvent?.zones?.length) return;

    // Ensure fresh setup
    this.teardownReviewCanvas();

    this.rCanvas = this.reviewCanvasRef.nativeElement;
    this.rCtx = this.rCanvas.getContext('2d') || undefined;

    if (!this.rCtx) return;

    // Size the canvas to its container
    const parent = this.rCanvas.parentElement!;
    const sizeCanvas = () => {
      const rect = parent.getBoundingClientRect();
      // Set actual pixel size to match rendered CSS size
      this.rCanvas!.width = Math.max(300, Math.floor(rect.width));
      this.rCanvas!.height = Math.max(240, Math.floor(rect.height));
      this.fitZonesToCanvas();
      this.drawReview();
    };

    sizeCanvas();

    // Observe container resize
    this.resizeObserver = new ResizeObserver(sizeCanvas);
    this.resizeObserver.observe(parent);

    // Click selection
    this.rCanvas.addEventListener('click', this.onReviewCanvasClick);
  }

  private teardownReviewCanvas(): void {
    if (this.resizeObserver && this.rCanvas?.parentElement) {
      this.resizeObserver.unobserve(this.rCanvas.parentElement);
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
    if (this.rCanvas) {
      this.rCanvas.removeEventListener('click', this.onReviewCanvasClick);
    }
    this.rCanvas = undefined;
    this.rCtx = undefined;
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (this.activeTab === 'zones') {
      // ResizeObserver handles it, but keep this in case
      this.drawReview();
    }
  }

  private fitZonesToCanvas(): void {
    if (!this.rCanvas || !this.selectedEvent?.zones?.length) return;

    const { minX, minY, maxX, maxY } = this.getZonesBounds();
    const objectWidth = maxX - minX || 1;
    const objectHeight = maxY - minY || 1;

    // Leave a small margin
    const margin = 20;
    const availableWidth = this.rCanvas.width - margin * 2;
    const availableHeight = this.rCanvas.height - margin * 2;

    const scaleX = availableWidth / objectWidth;
    const scaleY = availableHeight / objectHeight;
    this.rScale = Math.min(scaleX, scaleY);

    const scaledWidth = objectWidth * this.rScale;
    const scaledHeight = objectHeight * this.rScale;

    // Centering offset so that top-left of bounds maps to margin
    this.rOffset.x =
      margin + (availableWidth - scaledWidth) / 2 - minX * this.rScale;
    this.rOffset.y =
      margin + (availableHeight - scaledHeight) / 2 - minY * this.rScale;
  }

  private drawReview(): void {
    if (!this.rCtx || !this.rCanvas || !this.selectedEvent) return;

    const ctx = this.rCtx;
    ctx.save();
    ctx.clearRect(0, 0, this.rCanvas.width, this.rCanvas.height);

    // Apply transform
    ctx.translate(this.rOffset.x, this.rOffset.y);
    ctx.scale(this.rScale, this.rScale);

    // Draw zones
    (this.selectedEvent.zones || []).forEach((zone: any) =>
      this.drawZoneShape(ctx, zone)
    );

    // Highlight selected zone
    if (this.selectedZone) {
      this.highlightZone(ctx, this.selectedZone);
    }

    ctx.restore();
  }

  private drawZoneShape(ctx: CanvasRenderingContext2D, zone: any): void {
    const coords = zone.coordinates || {};
    const center = this.getZoneCenter(zone);

    ctx.save();
    // Move to center then rotate (rotation expected in radians like pasted4)
    ctx.translate(center.x, center.y);
    ctx.rotate(zone.rotation || 0);

    // Style similar to pasted4
    const isSoldOut = (zone.maxTickets ?? 0) - (zone.soldTickets ?? 0) <= 0;
    ctx.fillStyle =
      zone.isSellable && !isSoldOut
        ? this.withAlpha(zone.color, 0.5)
        : '#55555580';
    ctx.strokeStyle = zone.isSellable && !isSoldOut ? zone.color : '#888888';
    ctx.lineWidth = 2 / this.rScale;

    switch (zone.shape) {
      case 'rectangle': {
        const w = coords.width || 0;
        const h = coords.height || 0;
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.strokeRect(-w / 2, -h / 2, w, h);
        break;
      }
      case 'circle': {
        ctx.beginPath();
        ctx.arc(0, 0, coords.radius || 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        break;
      }
      case 'polygon': {
        if (coords.points && coords.points.length >= 3) {
          const pCenter = this.getZoneCenter({ ...zone, rotation: 0 });
          ctx.beginPath();
          ctx.moveTo(
            coords.points[0].x - pCenter.x,
            coords.points[0].y - pCenter.y
          );
          for (let i = 1; i < coords.points.length; i++) {
            ctx.lineTo(
              coords.points[i].x - pCenter.x,
              coords.points[i].y - pCenter.y
            );
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        break;
      }
    }

    // Label
    ctx.fillStyle = '#FFFFFF';
    const fontSize = 16 / this.rScale;
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(zone.name ?? '', 0, 0);

    ctx.restore();
  }

  private highlightZone(ctx: CanvasRenderingContext2D, zone: any): void {
    const coords = zone.coordinates || {};
    const center = this.getZoneCenter(zone);
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(zone.rotation || 0);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4 / this.rScale;
    ctx.shadowColor = 'yellow';
    ctx.shadowBlur = 15;

    switch (zone.shape) {
      case 'rectangle': {
        const w = coords.width || 0;
        const h = coords.height || 0;
        ctx.strokeRect(-w / 2, -h / 2, w, h);
        break;
      }
      case 'circle': {
        ctx.beginPath();
        ctx.arc(0, 0, coords.radius || 0, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      }
      case 'polygon': {
        if (coords.points && coords.points.length >= 3) {
          const pCenter = this.getZoneCenter({ ...zone, rotation: 0 });
          ctx.beginPath();
          ctx.moveTo(
            coords.points[0].x - pCenter.x,
            coords.points[0].y - pCenter.y
          );
          for (let i = 1; i < coords.points.length; i++) {
            ctx.lineTo(
              coords.points[i].x - pCenter.x,
              coords.points[i].y - pCenter.y
            );
          }
          ctx.closePath();
          ctx.stroke();
        }
        break;
      }
    }
    ctx.restore();
  }

  private withAlpha(hexOrColor: string, alpha: number): string {
    // Handles hex like #RRGGBB or rgba already
    if (/^#([0-9a-f]{6})$/i.test(hexOrColor)) {
      const r = parseInt(hexOrColor.slice(1, 3), 16);
      const g = parseInt(hexOrColor.slice(3, 5), 16);
      const b = parseInt(hexOrColor.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return hexOrColor; // fallback
  }

  private handleCanvasClick(e: MouseEvent): void {
    if (!this.rCanvas || !this.selectedEvent?.zones?.length) return;

    // Convert to canvas pixel coordinates
    const rect = this.rCanvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // To world space
    const wx = (px - this.rOffset.x) / this.rScale;
    const wy = (py - this.rOffset.y) / this.rScale;

    const zones = [...this.selectedEvent.zones].reverse();
    const hit = zones.find((z: any) => this.isPointInZone(wx, wy, z));

    this.selectedZone = hit || null;
    this.drawReview();
  }

  private isPointInZone(x: number, y: number, zone: any): boolean {
    const center = this.getZoneCenter(zone);
    const cos = Math.cos(-(zone.rotation || 0));
    const sin = Math.sin(-(zone.rotation || 0));
    const dx = x - center.x;
    const dy = y - center.y;
    const rx = dx * cos - dy * sin + center.x;
    const ry = dx * sin + dy * cos + center.y;

    const c = zone.coordinates || {};
    switch (zone.shape) {
      case 'rectangle':
        return (
          rx >= c.x &&
          rx <= c.x + (c.width || 0) &&
          ry >= c.y &&
          ry <= c.y + (c.height || 0)
        );
      case 'circle': {
        const dist = Math.hypot(rx - c.x, ry - c.y);
        return dist <= (c.radius || 0);
      }
      case 'polygon':
        if (!c.points || c.points.length < 3) return false;
        return this.isPointInPolygon(rx, ry, c.points);
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

  private getZoneCenter(zone: any): { x: number; y: number } {
    const c = zone.coordinates || {};
    switch (zone.shape) {
      case 'rectangle':
        return { x: c.x + (c.width || 0) / 2, y: c.y + (c.height || 0) / 2 };
      case 'circle':
        return { x: c.x, y: c.y };
      case 'polygon':
        if (c.points && c.points.length) {
          const sumX = c.points.reduce((s: number, p: any) => s + p.x, 0);
          const sumY = c.points.reduce((s: number, p: any) => s + p.y, 0);
          return { x: sumX / c.points.length, y: sumY / c.points.length };
        }
        return { x: c.x || 0, y: c.y || 0 };
    }
    return { x: c.x || 0, y: c.y || 0 };
  }

  private getZonesBounds(): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } {
    const zones = this.selectedEvent?.zones || [];
    if (zones.length === 0) return { minX: 0, minY: 0, maxX: 1, maxY: 1 };

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    zones.forEach((zone: any) => {
      const box = this.getZoneBoundingBox(zone);
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    });

    return { minX, minY, maxX, maxY };
  }

  private getZoneBoundingBox(zone: any): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const c = zone.coordinates || {};
    switch (zone.shape) {
      case 'rectangle':
        return { x: c.x, y: c.y, width: c.width || 0, height: c.height || 0 };
      case 'circle': {
        const r = c.radius || 0;
        return { x: c.x - r, y: c.y - r, width: 2 * r, height: 2 * r };
      }
      case 'polygon': {
        if (!c.points || c.points.length === 0) {
          return { x: c.x || 0, y: c.y || 0, width: 0, height: 0 };
        }
        const xs = c.points.map((p: any) => p.x);
        const ys = c.points.map((p: any) => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      }
    }
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  // ---------- Other helpers ----------
  onZoneClick(zone: any): void {
    // Kept for legacy call sites; now handled via canvas click
    this.selectedZone = zone;
    this.drawReview();
  }

  getZoneProgress(zone: any): number {
    return zone?.maxTickets > 0
      ? ((zone.soldTickets || 0) / zone.maxTickets) * 100
      : 0;
  }

  formatCurrency(value: number): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  }

  formatDate(date?: string): string {
    if (!date) return '—';
    const d = new Date(date);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString('vi-VN');
  }

  getEventDateRange(event: Events): string {
    const sD = event.startDate ?? '—';
    const sT = event.startTime ?? '';
    const eD = event.endDate ?? '—';
    const eT = event.endTime ?? '';
    return `Từ ${sD} ${sT} đến ${eD} ${eT}`.trim();
  }

  getTotalSeats(event: Events): number {
    return (
      event.zones?.reduce((sum, zone) => sum + (zone.maxTickets || 0), 0) || 0
    );
  }

  getTotalRevenue(event: Events): number {
    return (
      event.zones?.reduce(
        (sum, zone) => sum + (zone.price || 0) * (zone.maxTickets || 0),
        0
      ) || 0
    );
  }

  getOrganizerDisplay(event: Events): string {
    const o = event.organizer as any;
    if (!o) return '—';
    const parts: string[] = [];
    if (o.name) parts.push(o.name);
    if (o.bio) parts.push(o.bio);
    return parts.length > 0 ? parts.join(' — ') : '—';
  }

  getVenueDisplay(event: Events): string {
    const v = event.venue as any;
    if (!v) return '—';
    const parts: string[] = [];
    if (v.province) parts.push(v.province);
    if (v.address) parts.push(v.address);
    return parts.length > 0 ? parts.join(' · ') : '—';
  }

  getPlaceholderImage(
    width: number = 600,
    height: number = 160,
    text: string = 'Hình ảnh tạm'
  ): string {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'%3E%3Crect width='${width}' height='${height}' fill='%23e2e8f0'/%3E%3Ctext x='20' y='${
      height / 2
    }' font-size='20' fill='%234a5568'%3E${text}%3C/text%3E%3C/svg%3E`;
  }

  getImg(url: string): string | null {
    if (!url) return null;
    return this.createEventService.urlImg(url);
  }

  // ---------- Approve / Reject with PrimeNG ConfirmDialog ----------
  approveEvent(): void {
    if (!this.selectedEvent) return;
    this.confirmationService.confirm({
      key: 'approveEvent',
      header: 'Xác nhận phê duyệt',
      message: `Bạn có chắc chắn muốn phê duyệt sự kiện "${this.selectedEvent.eventName}"?`,
      icon: 'pi pi-check-circle',
      acceptLabel: 'Phê duyệt',
      rejectLabel: 'Hủy',
      accept: () => {
        this.eventConfirmService
          .approveEvent(this.selectedEvent!.id)
          .subscribe({
            next: () => {
              this.toastrService.success('Đã phê duyệt sự kiện!', 'Thành công');
              this.closeDialog();
              this.loadEvents();
            },
            error: (error) => {
              console.error('Error approving event:', error);
              this.toastrService.error(
                'Có lỗi xảy ra khi phê duyệt sự kiện!',
                'Lỗi'
              );
            },
          });
      },
    });
  }

  rejectEvent(): void {
    if (!this.selectedEvent) return;
    this.confirmationService.confirm({
      key: 'rejectEvent',
      header: 'Xác nhận từ chối',
      message: `Bạn có chắc chắn muốn từ chối sự kiện "${this.selectedEvent.eventName}"?`,
      icon: 'pi pi-times-circle',
      acceptLabel: 'Từ chối',
      rejectLabel: 'Hủy',
      accept: () => {
        this.eventConfirmService
          .rejectEvent(this.selectedEvent!.id, '')
          .subscribe({
            next: () => {
              this.toastrService.success('Đã từ chối sự kiện!', 'Thành công');
              this.closeDialog();
              this.loadEvents();
            },
            error: (error) => {
              console.error('Error rejecting event:', error);
              this.toastrService.error(
                'Có lỗi xảy ra khi từ chối sự kiện!',
                'Lỗi'
              );
            },
          });
      },
    });
  }
}
