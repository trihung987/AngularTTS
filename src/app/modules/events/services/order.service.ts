import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../shared/services/http.service';
import { EventsListParams, EventsListResponse } from '../../../shared/models/events-list.model';
import { Events } from '../../../shared/models/event.model';
import { Order, OrderStatus } from '../../../shared/models/order.model';


@Injectable({
  providedIn: 'root',
})
export class OrderService {
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
    if (params.validateDate != null) {
      queryParams.validateDate = params.validateDate;
    }

    return this.httpService.get<EventsListResponse>(
      '/events/pagepublic',
      queryParams
    );
  }

  createOrder(reservationId: string): Observable<Order> {
    return this.httpService.post<Order>(`/orders/${reservationId}`, {});
  }

  validPaymentReturn(params: {
    [key: string]: string;
  }): Observable<OrderStatus> {
    return this.httpService.get<OrderStatus>('/paymentvnp/validreturn', params);
  }
}
