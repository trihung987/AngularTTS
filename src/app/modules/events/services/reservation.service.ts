import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';

import { HttpService } from '../../../shared/services/http.service';
import {
  HoldReservationRequest,
  Reservation,
} from '../../../shared/models/reservation.model';
import { Order } from '../../../shared/models/order.model';

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  constructor(private httpService: HttpService) {}

  holdTickets(request: HoldReservationRequest): Observable<Reservation> {
    return this.httpService.post<Reservation>('/reservations/hold', request);
  }

  getReservationById(uuid: string): Observable<Reservation> {
    return this.httpService.get<Reservation>(`/reservations/${uuid}`, {});
  }

  // confirmReservation(reservationId: string): Observable<Order> {
  //   return this.httpService.post<Order>(
  //     `/reservations/${reservationId}/confirm`,
  //     {}
  //   );
  // }

  cancelReservation(reservationId: string): Observable<void> {
    return this.httpService.delete(`/reservations/${reservationId}`);
  }

  getReservationNow(): Observable<string | null> {
    return this.httpService.get<string | null>('/reservations/now', {});
  }
}
