import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../shared/services/http.service';
import { Events } from '../../../shared/models/event.model';
import { CheckIn, CheckInStatus } from '../../../shared/models/check-in.model';

export interface CheckInListParams {
  page: number;
  size: number;
  eventId?: string;
  zoneId?: string;
  status?: CheckInStatus;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface CheckInListResponse {
  content: CheckIn[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface UpdateCheckInStatusRequest {
  status: CheckInStatus;
}

export interface CreateCheckInRequest {
  orderId: string;
}

@Injectable({
  providedIn: 'root',
})
export class CheckInService {
  constructor(private httpService: HttpService) {}

  /**
   * Lấy danh sách check-in theo event
   */
  getCheckInsByEvent(
    params: CheckInListParams
  ): Observable<CheckInListResponse> {
    const queryParams: any = {
      page: params.page,
      size: params.size,
    };

    if (params.sortBy) {
      queryParams.sort = `${params.sortBy},${params.sortDirection || 'DESC'}`;
    }

    if (params.eventId) {
      return this.httpService.get<CheckInListResponse>(
        `/check-ins/event/${params.eventId}`,
        queryParams
      );
    }

    return this.httpService.get<CheckInListResponse>('/check-ins', queryParams);
  }

  /**
   * Lấy danh sách check-in theo event và status
   */
  getCheckInsByEventAndStatus(
    eventId: string,
    status: CheckInStatus,
    params: CheckInListParams
  ): Observable<CheckInListResponse> {
    const queryParams: any = {
      page: params.page,
      size: params.size,
    };

    if (params.sortBy) {
      queryParams.sort = `${params.sortBy},${params.sortDirection || 'DESC'}`;
    }

    return this.httpService.get<CheckInListResponse>(
      `/check-ins/event/${eventId}/status/${status}`,
      queryParams
    );
  }

  /**
   * Lấy danh sách check-in theo zone
   */
  getCheckInsByZone(
    zoneId: string,
    params: CheckInListParams
  ): Observable<CheckInListResponse> {
    const queryParams: any = {
      page: params.page,
      size: params.size,
    };

    if (params.sortBy) {
      queryParams.sort = `${params.sortBy},${params.sortDirection || 'DESC'}`;
    }

    return this.httpService.get<CheckInListResponse>(
      `/check-ins/zone/${zoneId}`,
      queryParams
    );
  }

  /**
   * Cập nhật status check-in
   */
  updateCheckInStatus(
    checkInId: string,
    request: UpdateCheckInStatusRequest
  ): Observable<CheckIn> {
    return this.httpService.post<CheckIn>(
      `/check-ins/${checkInId}/status`,
      request
    );
  }

  /**
   * Tạo check-in từ order
   */
  createCheckInsFromOrder(
    request: CreateCheckInRequest
  ): Observable<CheckIn[]> {
    return this.httpService.post<CheckIn[]>('/check-ins', request);
  }

  /**
   * Lấy chi tiết check-in
   */
  getCheckInById(checkInId: string): Observable<CheckIn> {
    return this.httpService.get<CheckIn>(`/check-ins/${checkInId}`);
  }

  getCheckInByCode(checkInCode: string): Observable<CheckIn> {
    return this.httpService.get<CheckIn>(`/check-ins/code/${checkInCode}`);
  }

  getCheckInsByOrderId(orderId: string): Observable<CheckIn[]> {
    return this.httpService.get<CheckIn[]>(`/check-ins/order/${orderId}`);
  }
}
