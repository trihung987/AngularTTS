import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../shared/services/http.service';
import { EventsListParams, EventsListResponse } from '../../../shared/models/events-list.model';
import { Events } from '../../../shared/models/event.model';


@Injectable({
  providedIn: 'root',
})
export class EventService {
  constructor(private httpService: HttpService) {}

  getEvents(params: EventsListParams): Observable<EventsListResponse> {
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

    return this.httpService.get<EventsListResponse>(
      '/events/pagepublic',
      queryParams
    );
  }


}
