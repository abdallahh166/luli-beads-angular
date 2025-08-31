import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ErrorHandlerService } from './error-handler.service';
import { LoggingService } from './logging.service';

@Injectable()
export abstract class BaseService {
  protected readonly baseUrl = environment.api.baseUrl;
  protected readonly timeout = environment.api.timeout;

  constructor(
    protected http: HttpClient,
    protected errorHandler: ErrorHandlerService,
    protected logging: LoggingService,
    protected context: string
  ) {}

  protected get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    this.logging.debug(`GET request to ${url}`, this.context, { params });

    return this.http.get<T>(url, { params }).pipe(
      timeout(this.timeout),
      retry(1),
      catchError(error => {
        this.logging.error(`GET request failed: ${url}`, this.context, error);
        this.errorHandler.handleError(error, this.context);
        return throwError(() => error);
      })
    );
  }

  protected post<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    this.logging.debug(`POST request to ${url}`, this.context, { data });

    return this.http.post<T>(url, data).pipe(
      timeout(this.timeout),
      retry(1),
      catchError(error => {
        this.logging.error(`POST request failed: ${url}`, this.context, error);
        this.errorHandler.handleError(error, this.context);
        return throwError(() => error);
      })
    );
  }

  protected put<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    this.logging.debug(`PUT request to ${url}`, this.context, { data });

    return this.http.put<T>(url, data).pipe(
      timeout(this.timeout),
      retry(1),
      catchError(error => {
        this.logging.error(`PUT request failed: ${url}`, this.context, error);
        this.errorHandler.handleError(error, this.context);
        return throwError(() => error);
      })
    );
  }

  protected delete<T>(endpoint: string): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    this.logging.debug(`DELETE request to ${url}`, this.context);

    return this.http.delete<T>(url).pipe(
      timeout(this.timeout),
      retry(1),
      catchError(error => {
        this.logging.error(`DELETE request failed: ${url}`, this.context, error);
        this.errorHandler.handleError(error, this.context);
        return throwError(() => error);
      })
    );
  }

  protected patch<T>(endpoint: string, data: any): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    this.logging.debug(`PATCH request to ${url}`, this.context, { data });

    return this.http.patch<T>(url, data).pipe(
      timeout(this.timeout),
      retry(1),
      catchError(error => {
        this.logging.error(`PATCH request failed: ${url}`, this.context, error);
        this.errorHandler.handleError(error, this.context);
        return throwError(() => error);
      })
    );
  }

  protected createHeaders(additionalHeaders?: { [key: string]: string }): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    if (additionalHeaders) {
      Object.keys(additionalHeaders).forEach(key => {
        headers = headers.set(key, additionalHeaders[key]);
      });
    }

    return headers;
  }

  protected createParams(params: { [key: string]: any }): HttpParams {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        httpParams = httpParams.set(key, params[key].toString());
      }
    });

    return httpParams;
  }

  protected handleSuccess<T>(data: T, operation: string): T {
    this.logging.info(`${operation} completed successfully`, this.context, { data });
    return data;
  }

  protected handleError(error: any, operation: string): never {
    this.logging.error(`${operation} failed`, this.context, error);
    this.errorHandler.handleError(error, this.context);
    throw error;
  }
}
