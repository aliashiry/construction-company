import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { User } from '../interfaces/user.interface';
import { LOCAL_STORAGE_KEYS, API } from '../constants/app.constants';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient) {}

  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  currentUser$ = this.currentUserSubject.asObservable();

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  private getStoredUser(): User | null {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.CURRENT_USER);
    return stored ? JSON.parse(stored) : null;
  }

  login(email: string, password: string): Observable<User> {
    const url = `${API.BASE_URL}/Auth/login`;
    return this.http.post<User>(url, { email, password }).pipe(
      map(res => this.normalizeUser(res)),
      tap(user => {
        localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
      catchError(err => {
        return throwError(() => err);
      })
    );
  }

  register(fullName: string, email: string, password: string): Observable<User> {
    const url = `${API.BASE_URL}/Auth/register`;
    return this.http.post<User>(url, { fullName, email, password }).pipe(
      map(res => this.normalizeUser(res)),
      tap(user => {
        localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
      catchError(err => {
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.CURRENT_USER);
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  private normalizeUser(userLike: any): User {
    // Ensure the user object fits our User interface.
    return {
      id: userLike.id || userLike.userId || userLike._id || 'user-' + Math.random().toString(36).substr(2, 9),
      name: userLike.name || userLike.fullName || userLike.username || userLike.email?.split('@')[0],
      email: userLike.email || '',
      token: userLike.token || userLike.accessToken || ''
    };
  }
}

