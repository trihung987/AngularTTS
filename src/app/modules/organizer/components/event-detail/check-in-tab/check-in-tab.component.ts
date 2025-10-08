import {
  Component,
  Input,
  OnInit,
  OnChanges,
  Output,
  EventEmitter,
  signal,
} from '@angular/core';
import {
  CheckIn,
  CheckInStatus,
} from '../../../../../shared/models/check-in.model';

import {
  catchError,
  finalize,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import {
  CheckInListParams,
  CheckInService,
} from '../../../services/checkin.service';
import { Zone } from '../../../../../shared/models/zone.model';
import { Events } from '../../../../../shared/models/event.model';
import { CommonModule } from '@angular/common';

// PrimeNG Imports
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { QrScannerModalComponent } from '../../qr-scanner/qr-scanner.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-checkin-tab',
  templateUrl: './check-in-tab.component.html',
  imports: [
    CommonModule,
    QrScannerModalComponent,
    DialogModule,
    ButtonModule,
    CardModule,
    MessageModule,
    ProgressSpinnerModule,
    TagModule,
    QrScannerModalComponent
],
  providers: [MessageService],
  styleUrls: ['./check-in-tab.component.css'],
})
export class CheckinTabComponent implements OnInit, OnChanges {
  @Input() event!: Events;
  @Output() statsUpdated = new EventEmitter<{
    checkedIn: number;
    notCheckedIn: number;
  }>();

  checkIns: CheckIn[] = [];
  loading = signal<boolean>(false);
  error: string = '';

  // Pagination
  currentPage: number = 0;
  pageSize: number = 20;
  totalElements: number = 0;
  totalPages: number = 0;

  // Filters
  selectedZoneId: string = '';
  selectedStatus: CheckInStatus | '' = '';
  sortBy: 'checkInTime' | 'createdDate' = 'checkInTime';
  sortDirection: 'ASC' | 'DESC' = 'DESC';
  searchTerm: string = '';
  searchSubject = new Subject<string>();

  // Enums for template
  CheckInStatus = CheckInStatus;

  // Available zones from event
  availableZones: Zone[] = [];

  // QR Scanner Modal
  showQRScanner: boolean = false;

  // Confirmation Dialog
  showConfirmDialog: boolean = false;
  selectedCheckIn: CheckIn | null = null;
  confirmLoading: boolean = false;

  constructor(
    private checkInService: CheckInService,
    private messageService: MessageService,
    private toastrService: ToastrService
  ) {
    this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((term) => {
        this.searchTerm = term;
        this.currentPage = 0;
        this.loadCheckIns();
      });
  }

  ngOnInit(): void {
    this.initializeZones();
    this.loadCheckIns();
  }

  ngOnChanges(): void {
    if (this.event) {
      this.initializeZones();
      this.loadCheckIns();
    }
  }

  initializeZones(): void {
    if (this.event && this.event.zones) {
      this.availableZones = this.event.zones;
    }
  }

  loadCheckIns(): void {
    if (!this.event) return;

    this.loading.set(true);
    this.error = '';

    const params: CheckInListParams = {
      page: this.currentPage,
      size: this.pageSize,
      eventId: this.event.id,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection,
    };

    let request;

    if (this.selectedZoneId) {
      params.zoneId = this.selectedZoneId;
      request = this.checkInService.getCheckInsByZone(
        this.selectedZoneId,
        params
      );
    } else if (this.selectedStatus) {
      request = this.checkInService.getCheckInsByEventAndStatus(
        this.event.id,
        this.selectedStatus as CheckInStatus,
        params
      );
    } else {
      request = this.checkInService.getCheckInsByEvent(params);
    }

    request
      .pipe(
        catchError((error) => {
          this.error = 'Không thể tải danh sách check-in';
          console.error('Error loading check-ins:', error);
          return of({
            content: [],
            totalElements: 0,
            totalPages: 0,
            size: this.pageSize,
            number: this.currentPage,
          });
        }),
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe((response) => {
        this.checkIns = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.currentPage = response.number;

        if (this.searchTerm) {
          this.checkIns = this.checkIns.filter(
            (ci) =>
              ci.checkInCode
                .toLowerCase()
                .includes(this.searchTerm.toLowerCase()) ||
              ci.buyerName
                .toLowerCase()
                .includes(this.searchTerm.toLowerCase()) ||
              ci.buyerEmail
                .toLowerCase()
                .includes(this.searchTerm.toLowerCase())
          );
        }

        this.updateStats();
      });
  }

  updateStats(): void {
    const checkedIn = this.checkIns.filter(
      (ci) => ci.status === CheckInStatus.CHECKED_IN
    ).length;
    const notCheckedIn = this.checkIns.filter(
      (ci) => ci.status === CheckInStatus.NOT_CHECKED_IN
    ).length;

    this.statsUpdated.emit({
      checkedIn: checkedIn,
      notCheckedIn: notCheckedIn,
    });
  }

  onZoneFilterChange(zoneId: string): void {
    this.selectedZoneId = zoneId;
    this.currentPage = 0;
    this.loadCheckIns();
  }

  onStatusFilterChange(status: string): void {
    this.selectedStatus = status as CheckInStatus | '';
    this.currentPage = 0;
    this.loadCheckIns();
  }

  onSortChange(sort: string): void {
    const [field, direction] = sort.split('_');
    this.sortBy = field as 'checkInTime' | 'createdDate';
    this.sortDirection = direction as 'ASC' | 'DESC';
    this.currentPage = 0;
    this.loadCheckIns();
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  updateCheckInStatus(checkIn: CheckIn, newStatus: CheckInStatus): void {
    this.checkInService
      .updateCheckInStatus(checkIn.id, { status: newStatus })
      .pipe(
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể cập nhật trạng thái check-in',
          });
          console.error('Error updating check-in status:', error);
          return of(null);
        })
      )
      .subscribe((updated) => {
        if (updated) {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Check-in ${
              newStatus === CheckInStatus.CHECKED_IN
                ? 'thành công'
                : 'đã hoàn tác'
            }`,
          });
          this.loadCheckIns();
        }
      });
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadCheckIns();
    }
  }

  formatDateTime(dateTime: string | null): string {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    return date.toLocaleString('vi-VN');
  }

  getStatusBadgeClass(status: CheckInStatus): string {
    return status === CheckInStatus.CHECKED_IN ? 'success' : 'pending';
  }

  getStatusText(status: CheckInStatus): string {
    return status === CheckInStatus.CHECKED_IN ? 'Đã vào' : 'Chưa check-in';
  }

  get selectedStatusText(): string {
    if (!this.selectedStatus) return '';
    return this.getStatusText(this.selectedStatus as CheckInStatus);
  }

  get hasFilters(): boolean {
    return !!this.selectedZoneId || !!this.selectedStatus;
  }

  get selectedZoneName(): string {
    if (!this.selectedZoneId) return '';
    const zone = this.availableZones.find(
      (z) => z.id.toString() === this.selectedZoneId
    );
    return zone ? zone.name : '';
  }

  exportReport(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Thông báo',
      detail: 'Chức năng xuất báo cáo đang được phát triển',
    });
  }

  scanQRCode(): void {
    this.showQRScanner = true;
  }

  onQRCodeScanned(checkInCode: string): void {
    console.log('QR Code scanned:', checkInCode);
    this.showQRScanner = false;

    // Tìm check-in với mã đã quét
    //const checkIn = this.checkIns.find((ci) => ci.checkInCode === checkInCode);
    const checkIn = null;
    if (checkIn) {
      this.selectedCheckIn = checkIn;
      this.showConfirmDialog = true;
    } else {
      // Nếu không tìm thấy trong danh sách hiện tại, gọi API
      this.loading.set(true);
      this.checkInService
        .getCheckInByCode(checkInCode)
        .pipe(
          catchError((error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Không tìm thấy',
              detail: `Không tìm thấy check-in với mã: ${checkInCode}`,
            });
            console.error('Error finding check-in:', error);
            this.toastrService.error(error.error.message, 'Check in thất bại');
            this.loading.set(false);
            return of(null);
          })
        )
        .subscribe((foundCheckIn) => {
          this.loading.set(false);
          if (foundCheckIn) {
            this.selectedCheckIn = foundCheckIn;
            this.showConfirmDialog = true;
          }
        });
    }
  }

  closeQRScanner(): void {
    this.showQRScanner = false;
  }

  confirmCheckIn(): void {
    if (!this.selectedCheckIn) return;

    this.confirmLoading = true;
    const newStatus =
      this.selectedCheckIn.status === CheckInStatus.CHECKED_IN
        ? CheckInStatus.CHECKED_IN // Re-checkin
        : CheckInStatus.CHECKED_IN;

    this.checkInService
      .updateCheckInStatus(this.selectedCheckIn.id, { status: newStatus })
      .pipe(
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể cập nhật trạng thái check-in',
          });
          console.error('Error updating check-in status:', error);
          this.toastrService.error('Không thể cập nhật trạng thái check-in', 'Lỗi');
          this.confirmLoading = false;
          return of(null);
        }),
        finalize(() => {
          this.confirmLoading = false;
        })
      )
      .subscribe((updated) => {
        if (updated) {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Check-in thành công!',
          });
          this.showConfirmDialog = false;
          this.selectedCheckIn = null;
          this.loadCheckIns();
          this.toastrService.success('Check-in thành công!', 'Thành công');
        }
      });
  }

  cancelConfirmDialog(): void {
    this.showConfirmDialog = false;
    this.selectedCheckIn = null;
  }
}
