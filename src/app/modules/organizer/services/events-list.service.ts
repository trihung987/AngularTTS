// src/app/services/events-list.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpService } from '../../../shared/services/http.service';
import { EventsListParams, EventsListResponse } from '../../../shared/models/events-list.model';
import { Events } from '../../../shared/models/event.model';



@Injectable({
  providedIn: 'root',
})
export class EventsListService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private httpService: HttpService) {}

  getEvents(params: EventsListParams): Observable<EventsListResponse> {
    this.loadingSubject.next(true);

    const queryParams: any = {
      page: params.page,
      size: params.size,
    };

    if (params.status && params.status !== 'ALL') {
      queryParams.status = params.status;
    }

    if (params.search) {
      queryParams.search = params.search;
    }

    if (params.sortBy) {
      queryParams.sortBy = params.sortBy;
      queryParams.sortDirection = params.sortDirection || 'DESC';
    }

    return this.httpService
      .get<EventsListResponse>('/events/page', queryParams)
      .pipe
      ();
  }

  deleteEvent(eventId: string): Observable<void> {
    return this.httpService.delete<void>(`/events/${eventId}`);
  }

  duplicateEvent(eventId: string): Observable<Events> {
    return this.httpService.post<Events>(
      `/events/${eventId}/duplicate`,
      {}
    );
  }

  updateEventStatus(
    eventId: string,
    status: 'DRAFT' | 'PUBLISHED'
  ): Observable<Events> {
    return this.httpService.post<Events>(
      `/events/${eventId}/status`,
      { status }
    );
  }

}
