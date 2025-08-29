import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import {
  CreateEventService,
  EventData,
} from '../../../services/events.service';

@Component({
  selector: 'step1-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step1-info.component.html',
  styleUrls: ['./step1-info.component.css'],
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
    trigger('imagePreview', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate(
          '300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'scale(1)' })
        ),
      ]),
    ]),
  ],
})
export class Step1InfoComponent implements OnInit, OnDestroy {
  @Output() stepComplete = new EventEmitter<boolean>();
  @ViewChild('eventImageInput') eventImageInput!: ElementRef<HTMLInputElement>;
  @ViewChild('bannerImageInput')
  bannerImageInput!: ElementRef<HTMLInputElement>;
  @ViewChild('organizerLogoInput')
  organizerLogoInput!: ElementRef<HTMLInputElement>;

  private destroy$ = new Subject<void>();

  eventData: Partial<EventData> = {
    eventName: '',
    eventImage: null,
    eventBanner: null,
    eventCategory: '',
    eventDescription: '',
    venue: {
      province: '',
      address: '',
    },
    organizer: {
      name: '',
      bio: '',
      logo: null,
    },
  };

  eventImagePreview: string | null = null;
  bannerImagePreview: string | null = null;
  organizerLogoPreview: string | null = null;

  categories: string[] = [];
  provinces: string[] = [];

  // Validation states
  validationErrors: { [key: string]: string } = {};

  constructor(
    private createEventService: CreateEventService,
    private changeDetectionRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.createEventService.eventData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(()=>{
        this.loadInitialData();
      });

    this.setupDataBinding();
    this.loadCategories();
    this.loadProvinces();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData() {
    const savedData = this.createEventService.getCurrentEventData();
    console.log("step 1 data: ",savedData)
    if (savedData) {
      this.eventData = {
        ...this.eventData,
        ...savedData,
        // Ensure nested objects are initialized
        venue: savedData.venue || { province: '', address: '' },
        organizer: savedData.organizer || { name: '', bio: '', logo: null },
      };

      // Restore image previews if they exist in the service
      if (savedData.eventImage instanceof File) {
        this.createImagePreview(savedData.eventImage, 'event');
      }
      if (savedData.eventBanner instanceof File) {
        this.createImagePreview(savedData.eventBanner, 'banner');
      }
      if (savedData.organizer?.logo instanceof File) {
        this.createImagePreview(savedData.organizer.logo, 'organizer');
      }
    }
  }

  private setupDataBinding() {
    const dataChange$ = new Subject<void>();

    dataChange$
      .pipe(debounceTime(600), takeUntil(this.destroy$))
      .subscribe(() => {
        this.saveData();
        // this.validateStep();  dùng này để valiadate mỗi khi data thay đổi với debounce 600
        //là sau mỗi lần ngừng gõ đúng 0.6s thì sẽ chạy
      });

    this.onDataChange = () => dataChange$.next();
  }

  public onDataChange() {
    // This will be overridden in setupDataBinding
  }

  private loadCategories() {
    this.createEventService
      .getEventCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
        },
        error: (err) => console.error('Failed to load categories', err),
      });
  }

  private loadProvinces() {
    this.createEventService
      .getProvinces()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (provinces) => {
          this.provinces = provinces;
        },
        error: (err) => console.error('Failed to load provinces', err),
      });
  }

  // File handling
  onEventImageSelect(event: Event) {
    this.handleImageSelection(event, 'eventImage', 'event');
  }

  onBannerImageSelect(event: Event) {
    this.handleImageSelection(event, 'bannerImage', 'banner');
  }

  onOrganizerLogoSelect(event: Event) {
    this.handleImageSelection(event, 'organizerLogo', 'organizer');
  }

  private handleImageSelection(
    event: Event,
    errorKey: string,
    type: 'event' | 'banner' | 'organizer'
  ) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      if (this.validateImageFile(file, errorKey)) {
        if (type === 'event') this.eventData.eventImage = file;
        else if (type === 'banner') this.eventData.eventBanner = file;
        else if (type === 'organizer' && this.eventData.organizer)
          this.eventData.organizer.logo = file;

        this.createImagePreview(file, type);
        this.onDataChange();
      }
    }
  }

  private validateImageFile(file: File, errorKey: string): boolean {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      this.validationErrors[errorKey] = 'Chỉ chấp nhận file JPG, PNG, WEBP';
      return false;
    }

    if (file.size > maxSize) {
      this.validationErrors[errorKey] = 'Kích thước file tối đa 5MB';
      return false;
    }

    delete this.validationErrors[errorKey];
    return true;
  }

  private createImagePreview(
    file: File,
    type: 'event' | 'banner' | 'organizer'
  ) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'event') this.eventImagePreview = result;
      else if (type === 'banner') this.bannerImagePreview = result;
      else this.organizerLogoPreview = result;
      this.changeDetectionRef.detectChanges(); //
    };
    reader.readAsDataURL(file);
  }

  removeEventImage() {
    this.eventData.eventImage = null;
    this.eventImagePreview = null;
    this.eventImageInput.nativeElement.value = '';
    this.onDataChange();
  }

  removeBannerImage() {
    this.eventData.eventBanner = null;
    this.bannerImagePreview = null;
    this.bannerImageInput.nativeElement.value = '';
    this.onDataChange();
  }

  removeOrganizerLogo() {
    if (this.eventData.organizer) this.eventData.organizer.logo = null;
    this.organizerLogoPreview = null;
    this.organizerLogoInput.nativeElement.value = '';
    this.onDataChange();
  }

  onDescriptionChange() {
    this.onDataChange();
  }

  public validateStep(fromNext:boolean = true): boolean {
    this.validationErrors = {};
    let isValid = true;
    const data = this.eventData;

    // --- Basic Info ---
    if (!data.eventName?.trim()) {
      this.validationErrors['eventName'] = 'Tên sự kiện là bắt buộc';
      isValid = false;
    } else if (data.eventName.trim().length < 5) {
      this.validationErrors['eventName'] =
        'Tên sự kiện phải có ít nhất 5 ký tự';
      isValid = false;
    }

    if (!data.eventCategory) {
      this.validationErrors['eventCategory'] = 'Vui lòng chọn thể loại sự kiện';
      isValid = false;
    }

    // --- Images ---
    if (!data.eventImage) {
      this.validationErrors['eventImage'] = 'Ảnh đại diện là bắt buộc';
      isValid = false;
    }
    if (!data.eventBanner) {
      this.validationErrors['bannerImage'] = 'Ảnh bìa là bắt buộc';
      isValid = false;
    }

    // --- Description ---
    if (!data.eventDescription?.trim()) {
      this.validationErrors['eventDescription'] = 'Mô tả sự kiện là bắt buộc';
      isValid = false;
    } else if (data.eventDescription.trim().length < 20) {
      this.validationErrors['eventDescription'] =
        'Mô tả sự kiện phải có ít nhất 20 ký tự';
      isValid = false;
    }

    // --- Venue ---
    if (!data.venue?.province) {
      this.validationErrors['province'] = 'Vui lòng chọn tỉnh/thành phố';
      isValid = false;
    }
    if (!data.venue?.address?.trim()) {
      this.validationErrors['address'] = 'Địa chỉ chi tiết là bắt buộc';
      isValid = false;
    }

    // --- Organizer ---
    if (!data.organizer?.name?.trim()) {
      this.validationErrors['organizerName'] = 'Tên ban tổ chức là bắt buộc';
      isValid = false;
    }
    if (!data.organizer?.bio?.trim()) {
      this.validationErrors['organizerBio'] =
        'Giới thiệu ban tổ chức là bắt buộc';
      isValid = false;
    }
    if (!data.organizer?.logo) {
      this.validationErrors['organizerLogo'] = 'Logo ban tổ chức là bắt buộc';
      isValid = false;
    }

    if (fromNext)
      this.stepComplete.emit(isValid);
    return isValid;
  }

  private saveData() {
    this.createEventService.updateEventData(this.eventData);
    console.warn(this.eventData.organizer?.logo, 'organizer logo');
  }

  getCharacterCount(text: string): number {
    return text ? text.length : 0;
  }
}
