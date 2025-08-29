// http.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StorageWrapperService } from './storage-wrapper.service';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  private apiBaseUrl = environment.apiBaseUrl;
  constructor(
    private http: HttpClient,
    private storage: StorageWrapperService
  ) {}

  // CHANGED: Added options to skip Content-Type and fixed immutability bug
  private getHeaders(
    noBearer: boolean,
    options: { noContentType?: boolean } = {}
  ): HttpHeaders {
    let headers = new HttpHeaders();
    const token = this.storage.getItem('accessToken');

    if (!options.noContentType) {
      headers = headers.set('Content-Type', 'application/json');
    }

    if (token && !noBearer) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  get<T>(
    endpoint: string,
    params?: any,
    responseType: 'json' | 'text' = 'json'
  ): Observable<T> {
    const optionType = responseType === 'text' ? ('text' as 'json') : 'json';
    return this.http.get<T>(`${this.apiBaseUrl}${endpoint}`, {
      headers: this.getHeaders(false),
      params,
      responseType: optionType,
    });
  }

  post<T>(
    endpoint: string,
    data: any,
    responseType: 'json' | 'text' = 'json',
    noBearer: boolean = false,
    options: { noContentType?: boolean } = {}
  ): Observable<T> {
    const optionType = responseType === 'text' ? ('text' as 'json') : 'json';
    return this.http.post<T>(`${this.apiBaseUrl}${endpoint}`, data, {
      headers: this.getHeaders(noBearer, options), // Pass options here
      responseType: optionType,
    });
  }

  put<T>(
    endpoint: string,
    data: any,
    responseType: 'json' | 'text' = 'json',
    noBearer: boolean = false,
    options: { noContentType?: boolean } = {}
  ): Observable<T> {
    const optionType = responseType === 'text' ? ('text' as 'json') : 'json';
    return this.http.put<T>(`${this.apiBaseUrl}${endpoint}`, data, {
      headers: this.getHeaders(noBearer, options),
      responseType: optionType,
    });
  }

  delete<T>(
    endpoint: string,
    responseType: 'json' | 'text' = 'json'
  ): Observable<T> {
    const optionType = responseType === 'text' ? ('text' as 'json') : 'json';
    return this.http.delete<T>(`${this.apiBaseUrl}${endpoint}`, {
      headers: this.getHeaders(false),
      responseType: optionType,
    });
  }
}
