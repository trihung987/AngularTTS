import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';

import { HttpService } from '../../../shared/services/http.service';
import { HoldReservationRequest, Reservation } from '../../../shared/models/reservation.model';
import { Order, OrderListParams, OrderPageResponse } from '../../../shared/models/order.model';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  constructor(private httpService: HttpService) {}
  getOrders(params: OrderListParams): Observable<OrderPageResponse> {
    const queryParams: OrderListParams = {
      page: params.page,
      size: params.size,
    };

    if (params.sortBy) {
      queryParams.sortBy = params.sortBy;
      queryParams.sortDirection = params.sortDirection || 'DESC';
    }

    return this.httpService.get<OrderPageResponse>('/orders',
      queryParams,
    );
  }

}
