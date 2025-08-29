// steps/step2-time/step2-time.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  LOCALE_ID,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  ],
  templateUrl: './step2-time.component.html',
  styleUrls: ['./step2-time.component.css'],
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

  constructor(private createEventService: CreateEventService) {}

  ngOnInit() {
    this.loadInitialData();
    this.setupDataBinding();
    this.setupSlugGeneration();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData() {
    const savedData = this.createEventService.getCurrentEventData();
    if (savedData) {
      // Directly assign values. No conversion needed as the service uses Date objects.
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
        //this.validateStep();
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
    // This will be overridden in setupDataBinding
  }

  onDateTimeChange() {
    if (
      this.eventData.startDate &&
      this.eventData.endDate &&
      this.eventData.endDate < this.eventData.startDate
    ) {
      this.eventData.endDate = new Date(this.eventData.startDate);
    }
    this.validateDateTime();
    this.onDataChange();
  }

  private getFullDateTime(date: Date | null, time: string): Date | null {
    if (!date || !time) return null;
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  }

  private validateDateTime() {
    this.dateTimeConflict = false;
    const startDateTime = this.getFullDateTime(
      this.eventData.startDate,
      this.eventData.startTime
    );
    const endDateTime = this.getFullDateTime(
      this.eventData.endDate,
      this.eventData.endTime
    );

    if (startDateTime && endDateTime && endDateTime <= startDateTime) {
      this.dateTimeConflict = true;
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
    this.validationErrors = {};
    let isValid = true;
    if (!this.eventData.startDate) {
      this.validationErrors['startDate'] = 'Ngày bắt đầu là bắt buộc';
      isValid = false;
    }
    if (!this.eventData.endDate) {
      this.validationErrors['endDate'] = 'Ngày kết thúc là bắt buộc';
      isValid = false;
    }
    if (!this.eventData.startTime) {
      this.validationErrors['startTime'] = 'Giờ bắt đầu là bắt buộc';
      isValid = false;
    }
    if (!this.eventData.endTime) {
      this.validationErrors['endTime'] = 'Giờ kết thúc là bắt buộc';
      isValid = false;
    }
    if (this.dateTimeConflict) {
      this.validationErrors['endTime'] =
        'Thời gian kết thúc phải sau thời gian bắt đầu';
      isValid = false;
    }
    // if (!this.eventData.slug || this.eventData.slug.trim().length === 0) {
    //   this.validationErrors['slug'] = 'Đường dẫn sự kiện là bắt buộc';
    //   isValid = false;
    // } else if (this.eventData.slug.trim().length < 3) {
    //   this.validationErrors['slug'] = 'Đường dẫn phải có ít nhất 3 ký tự';
    //   isValid = false;
    // } else if (!/^[a-z0-9-]+$/.test(this.eventData.slug)) {
    //   this.validationErrors['slug'] =
    //     'Đường dẫn chỉ được chứa chữ thường, số và dấu gạch ngang';
    //   isValid = false;
    // } else if (this.slugAvailable === false) {
    //   this.validationErrors['slug'] = 'Đường dẫn này đã được sử dụng';
    //   isValid = false;
    // }
    // const isStepValid = isValid && this.slugAvailable === true;
    console.log("step2",isValid)
    const isStepValid = isValid;
    if (fromNext) this.stepComplete.emit(isValid);
    this.stepComplete.emit(isStepValid);
    return isStepValid;
  }

  private saveData() {
    // No conversion needed. The service expects Date objects.
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
