import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  LOCALE_ID,
  ViewChild,
} from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

// Angular Material Imports
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';

import {
  CreateEventService,
  EventData,
} from '../../../services/events.service';

import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';

registerLocaleData(localeVi);

import {
  NativeDateAdapter,
  MAT_DATE_FORMATS,
  DateAdapter,
} from '@angular/material/core';
import { RequiredComponent } from "../../../../../shared/components/required/required.component";

// Định nghĩa định dạng dùng trong Material
export const VI_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MM YYYY',
  },
};

// Adapter parse & format dd/MM/yyyy
export class ViDateAdapter extends NativeDateAdapter {
  override parse(value: any): Date | null {
    if (typeof value === 'string' && value.trim()) {
      const parts = value.split('/');
      if (parts.length === 3) {
        const day = +parts[0];
        const month = +parts[1] - 1;
        const year = +parts[2];
        if (
          !isNaN(day) &&
          !isNaN(month) &&
          !isNaN(year) &&
          year > 100 &&
          month >= 0 &&
          month < 12 &&
          day > 0 &&
          day <= 31
        ) {
          const date = new Date(year, month, day);
          // Kiểm tra lại tránh 31/02...
          if (
            date.getFullYear() === year &&
            date.getMonth() === month &&
            date.getDate() === day
          ) {
            return date;
          }
        }
      }
      return null;
    }
    return value ? new Date(value) : null;
  }

  override format(date: Date, displayFormat: any): string {
    if (!date) return '';
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }
}

@Component({
  selector: 'step2-time',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    RequiredComponent
],
  templateUrl: './step2-time.component.html',
  styleUrls: ['./step2-time.component.css'],
  providers: [
    { provide: DateAdapter, useClass: ViDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: VI_DATE_FORMATS },
  ],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate(
          '400ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate(
          '300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateX(0)' })
        ),
      ]),
    ]),
  ],
})
export class Step2TimeComponent implements OnInit, OnDestroy {
  @Output() stepComplete = new EventEmitter<boolean>();

  private destroy$ = new Subject<void>();

  eventData: {
    startDate: Date | null;
    endDate: Date | null;
    startTime: string;
    endTime: string;
    slug: string;
    timezone: string;
  } = {
    startDate: null,
    endDate: null,
    startTime: '',
    endTime: '',
    slug: '',
    timezone: 'Asia/Ho_Chi_Minh',
  };

  minDate: Date = new Date();
  maxDate: Date = new Date(new Date().getFullYear() + 2, 11, 31);

  isSlugManuallySet = false;
  isCheckingSlug = false;
  slugAvailable: boolean | null = null;
  suggestedSlugs: string[] = [];

  validationErrors: { [key: string]: string } = {};
  dateTimeConflict = false;

  @ViewChild('startDateInput', { read: NgModel }) startDateInput!: NgModel;
  @ViewChild('endDateInput', { read: NgModel }) endDateInput!: NgModel;

  constructor(private createEventService: CreateEventService) {}

  ngOnInit() {
    this.loadInitialData();
    this.minDate = this.startOfDay(new Date());
    this.maxDate = this.startOfDay(this.maxDate);
    this.setupDataBinding();
    this.setupSlugGeneration();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public loadInitialData() {
    const savedData = this.createEventService.getCurrentEventData();
    if (savedData) {
      this.eventData.startDate = savedData.startDate || null;
      this.eventData.endDate = savedData.endDate || null;
      this.eventData.startTime = savedData.startTime || '';
      this.eventData.endTime = savedData.endTime || '';
      this.eventData.slug = savedData.slug || '';
      this.eventData.timezone = savedData.timezone || 'Asia/Ho_Chi_Minh';

      if (savedData.slug && savedData.eventName) {
        const autoSlug = this.createEventService.generateSlug(
          savedData.eventName
        );
        this.isSlugManuallySet = savedData.slug !== autoSlug;
      }
    }
  }

  private setupDataBinding() {
    const dataChange$ = new Subject<void>();
    dataChange$
      .pipe(debounceTime(500), takeUntil(this.destroy$))
      .subscribe(() => {
        this.saveData();
      });
    this.onDataChange = () => dataChange$.next();
  }

  private setupSlugGeneration() {
    this.createEventService.eventData$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((prev, curr) => prev.eventName === curr.eventName)
      )
      .subscribe((data) => {
        if (data.eventName && !this.isSlugManuallySet) {
          const newSlug = this.createEventService.generateSlug(data.eventName);
          if (newSlug !== this.eventData.slug) {
            this.eventData.slug = newSlug;
            this.checkSlugAvailability(newSlug);
            this.onDataChange();
          }
        }
      });
  }

  public onDataChange() {
    // overridden in setupDataBinding
  }

  private getFullDateTime(date: Date | null, time: string): Date | null {
    if (!date || !time) return null;
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  }

  private startOfDay(d: Date): Date {
    const nd = new Date(d);
    nd.setHours(0, 0, 0, 0);
    return nd;
  }

  onDateTimeChange() {
    this.validateDateTime();
    this.onDataChange();
  }

  // Helpers để tránh lặp thao tác set / delete lỗi
  private setError(key: string, message: string) {
    this.validationErrors = {
      ...this.validationErrors,
      [key]: message,
    };

    // Đánh dấu control của startDate | endDate là touched & dirty để show lỗi ngay
    // vì control này dùng mat của Angular Material nên sẽ không tự rerender khi mà dùng if khi có giá trị thay đổi
    // Component Angular Material chỉ rerender khi có sự kiện từ người dùng
    // (kích hoạt khi tương tác với control đó như nhập, thay đổi giá trị thay focus...)
    // vì vậy cần đánh dấu thủ công là đã tương tác với control đó khi validate từ bấm 1 nút button khác control đó (chẳng hạn nút submit)
    if (key === 'startDate' && this.startDateInput) {
      this.startDateInput.control.markAsTouched();
      this.startDateInput.control.markAsDirty();
    }
    if (key === 'endDate' && this.endDateInput) {
      this.endDateInput.control.markAsTouched();
      this.endDateInput.control.markAsDirty();
    }
  }

  private clearError(key: string) {
    delete this.validationErrors[key];
  }

  // Rút gọn & tránh ghi đè lỗi không cần thiết
  private validateDateTime() {
    // Xoá các lỗi ngày / thời gian có thể được set lại
    ['startDate', 'endDate', 'endTime'].forEach((k) => this.clearError(k));
    this.dateTimeConflict = false;

    const today = this.startOfDay(new Date());
    const start = this.eventData.startDate
      ? this.startOfDay(this.eventData.startDate)
      : null;
    let end = this.eventData.endDate
      ? this.startOfDay(this.eventData.endDate)
      : null;
    console.log('Validating dates:', start, this.eventData.startDate);
    // Start date validate
    if (!start) {
      this.setError(
        'startDate',
        'Ngày bắt đầu là bắt buộc và phải đúng định dạng'
      );
    } else {
      if (start < today) {
        this.setError('startDate', 'Ngày bắt đầu không được trong quá khứ');
      } else if (this.maxDate && start > this.startOfDay(this.maxDate)) {
        this.setError('startDate', 'Ngày bắt đầu vượt quá giới hạn cho phép');
      }
    }

    // End date validate
    if (!end) {
      this.setError(
        'endDate',
        'Ngày kết thúc là bắt buộc và phải đúng định dạng'
      );
    } else {
      if (this.maxDate && end > this.startOfDay(this.maxDate)) {
        this.setError('endDate', 'Ngày kết thúc vượt quá giới hạn cho phép');
      }
    }

    // Auto-correct end < start (chỉ khi cả hai hợp lệ ban đầu)
    if (
      start &&
      end &&
      end < start &&
      !this.validationErrors['startDate'] &&
      !this.validationErrors['endDate']
    ) {
      this.eventData.endDate = new Date(start);
      end = this.startOfDay(this.eventData.endDate);
    }

    // Kiểm tra xung đột thời gian nếu đủ dữ liệu
    if (
      start &&
      end &&
      this.eventData.startTime &&
      this.eventData.endTime &&
      !this.validationErrors['startDate'] &&
      !this.validationErrors['endDate']
    ) {
      const startDateTime = this.getFullDateTime(
        start,
        this.eventData.startTime
      );
      const endDateTime = this.getFullDateTime(end, this.eventData.endTime);
      if (startDateTime && endDateTime && endDateTime <= startDateTime) {
        this.setError(
          'endTime',
          'Thời gian kết thúc phải sau thời gian bắt đầu'
        );
        this.dateTimeConflict = true;
      }
    }
  }

  onSlugChange() {
    this.isSlugManuallySet = true;
    this.slugAvailable = null;
    if (this.eventData.slug && this.eventData.slug.trim().length > 0) {
      this.checkSlugAvailability(this.eventData.slug);
    }
    this.onDataChange();
  }

  private checkSlugAvailability(slug: string) {
    if (!slug || slug.trim().length === 0) return;
    this.isCheckingSlug = true;
    this.slugAvailable = null;

    this.createEventService
      .checkSlugAvailability(slug)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (isAvailable) => {
          this.slugAvailable = isAvailable;
          this.isCheckingSlug = false;
          if (!isAvailable) this.generateSlugSuggestions(slug);
        },
        error: () => {
          this.isCheckingSlug = false;
          this.slugAvailable = null;
        },
      });
  }

  private generateSlugSuggestions(baseSlug: string) {
    this.suggestedSlugs = [
      `${baseSlug}-${new Date().getFullYear()}`,
      `${baseSlug}-${Math.floor(Math.random() * 1000)}`,
      `${baseSlug}-new`,
    ];
  }

  selectSuggestedSlug(slug: string) {
    this.eventData.slug = slug;
    this.isSlugManuallySet = true;
    this.suggestedSlugs = [];
    this.checkSlugAvailability(slug);
    this.onDataChange();
  }

  generateRandomSlug() {
    const eventName =
      this.createEventService.getCurrentEventData().eventName || 'event';
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const newSlug = this.createEventService.generateSlug(
      `${eventName}-${randomSuffix}`
    );
    this.eventData.slug = newSlug;
    this.isSlugManuallySet = true;
    this.checkSlugAvailability(newSlug);
    this.onDataChange();
  }

  public validateStep(fromNext: boolean = true): boolean {
    this.validateDateTime();

    // Validate giờ (riêng, không xoá lỗi endTime nếu đang conflict do so sánh)
    if (!this.eventData.startTime) {
      this.setError('startTime', 'Giờ bắt đầu là bắt buộc');
    } else {
      this.clearError('startTime');
    }

    if (!this.eventData.endTime) {
      // Nếu chưa có giờ kết thúc mà chưa bị conflict thì set lỗi required
      if (!this.dateTimeConflict) {
        this.setError('endTime', 'Giờ bắt đầu là bắt buộc');
      }
    } else {
      // Chỉ clear khi không có conflict về thời gian
      if (!this.dateTimeConflict && this.validationErrors['endTime']) {
        // Nếu lỗi hiện tại là lỗi "kết thúc phải sau bắt đầu" mà vẫn conflict thì giữ
        if (
          this.validationErrors['endTime'] !==
          'Thời gian kết thúc phải sau thời gian bắt đầu'
        ) {
          this.clearError('endTime');
        } else if (!this.dateTimeConflict) {
          this.clearError('endTime');
        }
      } else if (!this.dateTimeConflict) {
        this.clearError('endTime');
      }
    }

    const isValid = Object.keys(this.validationErrors).length === 0;
    console.log('Step 2 validation:', isValid, this.validationErrors);

    if (fromNext) {
      this.stepComplete.emit(isValid);
    }
    return isValid;
  }

  private saveData() {
    this.createEventService.updateEventData(this.eventData);
  }

  getEventDuration(): string {
    const startDateTime = this.getFullDateTime(
      this.eventData.startDate,
      this.eventData.startTime
    );
    const endDateTime = this.getFullDateTime(
      this.eventData.endDate,
      this.eventData.endTime
    );
    if (!startDateTime || !endDateTime || endDateTime <= startDateTime)
      return '';

    const durationMs = endDateTime.getTime() - startDateTime.getTime();
    const hours = Math.floor(durationMs / 3600000);
    const minutes = Math.floor((durationMs % 3600000) / 60000);

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days} ngày ${
        remainingHours > 0 ? remainingHours + ' giờ' : ''
      }`.trim();
    } else if (hours > 0) {
      return `${hours} giờ ${minutes > 0 ? minutes + ' phút' : ''}`.trim();
    } else if (minutes > 0) {
      return `${minutes} phút`;
    }
    return '';
  }

  getSlugPreview(): string {
    if (!this.eventData.slug) return '';
    return `eventify.vn/events/${this.eventData.slug}`;
  }
}
