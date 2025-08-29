// src/app/services/events.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, delay, map, tap } from 'rxjs/operators';
import { HttpService } from '../../../shared/services/http.service';
import { Zone } from '../../../shared/models/zone.model';
import { Events } from '../../../shared/models/event.model';
import { environment } from '../../../../environments/environment.development';

export interface EventData {
  eventName: string;
  eventImage: File | null;
  eventBanner: File | null;
  eventCategory: string; // Sửa lại từ 'category' trong DTO thành 'eventCategory' để khớp
  eventDescription: string;
  venue: {
    province: string;
    address: string;
  };
  organizer: {
    name: string;
    bio: string;
    logo: File | null;
  };

  // Step 2: Time & Slug
  startDate: Date | null;
  endDate: Date | null;
  startTime: string;
  endTime: string;
  slug: string;
  timezone: string;

  // Step 3: Layout zone
  zones: Zone[];
  totalSeats: number;
  totalRevenue: number;

  // Step 4: Payment
  bankInfo: {
    accountHolder: string;
    accountNumber: string;
    bankName: string;
    bankBranch: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class CreateEventService {
  // State management subjects
  private eventDataSubject = new BehaviorSubject<Partial<EventData>>({});
  private stepCompletionSubject = new BehaviorSubject<{
    [key: number]: boolean;
  }>({
    1: false,
    2: false,
    3: false,
    4: false,
  });

  public eventData$ = this.eventDataSubject.asObservable();
  public stepCompletion$ = this.stepCompletionSubject.asObservable();
  private currentEventId: string | null = null;

  constructor(private httpService: HttpService) {}

  getCurrentEventData(): Partial<EventData> {
    return this.eventDataSubject.value;
  }

  updateEventData(data: Partial<EventData>): void {
    const currentData = this.getCurrentEventData();
    const updatedData = { ...currentData, ...data };
    this.eventDataSubject.next(updatedData);
    // console.log("Event data updated: ", updatedData); // For debugging
  }

  setStepCompletion(stepId: number, isCompleted: boolean): void {
    const currentCompletion = this.stepCompletionSubject.value;
    const updatedCompletion = { ...currentCompletion, [stepId]: isCompleted };
    this.stepCompletionSubject.next(updatedCompletion);
  }

  isStepValid(stepId: number): boolean {
    return this.stepCompletionSubject.value[stepId] || false;
  }
  private readonly DRAFT_ID_KEY = 'eventSaveID';

  resetEventData(): void {
    this.eventDataSubject.next({});
    this.stepCompletionSubject.next({ 1: false, 2: false, 3: false, 4: false });
    localStorage.removeItem(this.DRAFT_ID_KEY);
  }

  publishEvent(): Observable<any> {
    const eventData = this.getCurrentEventData();

    const formData = this.createEventFormData(eventData);

    return this.httpService
      .post<any>('/events', formData, 'json', false, { noContentType: true })
      .pipe(
        tap((response) =>
          console.log('Successfully published event', response)
        ),
        catchError((error) => {
          console.error('Error publishing event', error);
          return throwError(() => new Error('Failed to publish event.'));
        })
      );
  }

  getEventById(id: string): Observable<Partial<EventData>> {
    return this.httpService.get<Events>(`/events/${id}`).pipe(
      tap((event) => {
        this.currentEventId = event.id; // Store ID for save/publish actions
        localStorage.setItem(this.DRAFT_ID_KEY, event.id);
        console.log('EVENT nhận được từ resp', event);
      }),
      map((event) => this.mapResponseToEventData(event)),
      catchError((error) => {
        console.error('Error fetching event by ID', error);
        return throwError(() => new Error('Failed to fetch event data.'));
      })
    );
  }

  private mapResponseToEventData(event: Events): Partial<EventData> {
    return {
      eventName: event.eventName,
      eventCategory: event.eventCategory,
      eventDescription: event.eventDescription,
      venue: event.venue,
      organizer: {
        name: event.organizer.name,
        bio: event.organizer.bio,
        logo: event.organizer.logo as any, // URL from backend
      },
      startDate: event.startDate ? new Date(event.startDate) : null,
      endDate: event.endDate ? new Date(event.endDate) : null,
      startTime: event.startTime,
      endTime: event.endTime,
      slug: event.slug,
      timezone: event.timezone,
      zones: event.zones,
      bankInfo: event.bankInfo,
      eventImage: event.eventImage as any,
      eventBanner: event.eventBanner as any,
    };
  }

  async urlToFile(url: string, filename: string): Promise<File | null> {
    try {
      const fullUrl = url.startsWith('/')
        ? `${environment.apiBaseUrl}${url}`
        : url;
      const response = await fetch(fullUrl);
      const data = await response.blob();
      return new File([data], filename, { type: data.type });
    } catch (error) {
      console.error('Error converting URL to File:', error);
      return null;
    }
  }

  urlImg(url: string): string {
    const fullUrl = url.startsWith('/')
      ? `${environment.apiBaseUrl}${url}`
      : url;
    return fullUrl;
  }

  private createEventFormData(eventData: Partial<EventData>): FormData {
    // Check if the image property is a File object (new upload) or a string (existing URL)
    const eventImageFile =
      eventData.eventImage instanceof File ? eventData.eventImage : null;
    const eventBannerFile =
      eventData.eventBanner instanceof File ? eventData.eventBanner : null;
    const organizerLogoFile =
      eventData.organizer?.logo instanceof File
        ? eventData.organizer.logo
        : null;

    const payload: any = JSON.parse(JSON.stringify(eventData));
    const draftId = localStorage.getItem(this.DRAFT_ID_KEY);
    console.log('draftID', draftId);
    if (draftId) {
      payload.id = draftId;
    }
    //xóa dư thừa để adjust lại formdata khi gửi
    delete payload.eventImage;
    delete payload.eventBanner;
    if (payload.organizer) delete payload.organizer.logo;

    const formData = new FormData();
    formData.append('eventData', JSON.stringify(payload));
    if (eventImageFile) formData.append('eventImage', eventImageFile);
    if (eventBannerFile) formData.append('eventBanner', eventBannerFile);
    if (organizerLogoFile) formData.append('organizerLogo', organizerLogoFile);

    return formData;
  }

  getEventCategories(): Observable<string[]> {
    return this.httpService.get<string[]>('/data/categories');
  }

  getProvinces(): Observable<string[]> {
    return this.httpService.get<string[]>('/data/provinces');
  }

  getDistrictsByProvince(province: string): Observable<string[]> {
    return this.httpService.get<string[]>('/data/districts', { province });
  }

  getWardsByDistrict(district: string): Observable<string[]> {
    return this.httpService.get<string[]>('/data/wards', { district });
  }

  getBanks(): Observable<string[]> {
    return this.httpService.get<string[]>('/data/banks');
  }

  checkSlugAvailability(slug: string): Observable<boolean> {
    // Tạm thời vẫn mock, có thể kết nối API sau
    // return this.httpService.get<boolean>('/data/check-slug', { slug });
    const unavailableSlugs = ['test-event', 'demo-event', 'sample-event'];
    const isAvailable = !unavailableSlugs.includes(slug.toLowerCase());
    return of(isAvailable).pipe(delay(500));
  }

  // Lưu nháp sự kiện.
  // Tự động kiểm tra localStorage để quyết định tạo mới hay cập nhật.
  saveDraft(): Observable<any> {
    console.log('Saving draft...');
    const eventData = this.getCurrentEventData();
    const formData = this.createEventFormData(eventData);
    console.log('evenData saveDraft', eventData);
    // Gọi API lưu nháp
    return this.httpService
      .post<any>('/events/draft', formData, 'json', false, {
        noContentType: true,
      })
      .pipe(
        tap((response) => {
          // sau khi lưu thành công, lấy ID trả về và lưu vào localstorage
          if (response && response.id) {
            localStorage.setItem(this.DRAFT_ID_KEY, response.id);
            console.log('Draft saved successfully with ID:', response.id);
          }
        }),
        catchError((error) => {
          console.error('Error saving draft', error);
          return throwError(() => new Error('Failed to save draft.'));
        })
      );
  }

  generateSlug(eventName: string): string {
    return eventName
      .toLowerCase()
      .replace(/[áàảãạăắằẳẵặâấầẩẫậ]/g, 'a')
      .replace(/[éèẻẽẹêếềểễệ]/g, 'e')
      .replace(/[íìỉĩị]/g, 'i')
      .replace(/[óòỏõọôốồổỗộơớờởỡợ]/g, 'o')
      .replace(/[úùủũụưứừửữự]/g, 'u')
      .replace(/[ýỳỷỹỵ]/g, 'y')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }
}
