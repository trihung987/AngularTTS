import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../shared/services/http.service';
import {
  EventsListParams,
  EventsListResponse,
} from '../../../shared/models/events-list.model';
import { Events } from '../../../shared/models/event.model';

@Injectable({
  providedIn: 'root',
})
export class EventConfirmService {
  constructor(private httpService: HttpService) {}

  getPendingEvents(
    params: Omit<EventsListParams, 'status'>
  ): Observable<EventsListResponse> {
    const queryParams: any = {
      page: params.page,
      size: params.size,
    };

    if (params.search) {
      queryParams.search = params.search;
    }

    if (params.sortBy) {
      queryParams.sortBy = params.sortBy;
      queryParams.sortDirection = params.sortDirection || 'DESC';
    }

    if (params.validateDate != null) {
      queryParams.validateDate = params.validateDate;
    }

    return this.httpService.get<EventsListResponse>(
      '/events/pagepending',
      queryParams
    );
  }

  approveEvent(eventId: string): Observable<any> {
    return this.httpService.put(`/events/${eventId}/approve`, {});
  }

  rejectEvent(eventId: string, reason?: string): Observable<any> {
    return this.httpService.put(`/events/${eventId}/reject`, { reason });
  }
}
