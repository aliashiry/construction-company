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
  constructor(private http: HttpClient) { }

  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  currentUser$ = this.currentUserSubject.asObservable();

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  private getStoredUser(): User | null {
    const stored = localStorage.getItem(`CURRENT_USER`);
    return stored ? JSON.parse(stored) : null;
  }

  login(Email: string, Password: string): Observable<User> {
    const url = `${API.BASE_URL}/Auth/login`;
    return this.http.post<any>(url, { Email, Password }).pipe(
      map(res => this.normalizeUser(res)),
      tap(user => {
        localStorage.setItem('CURRENT_USER', JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
      catchError(err => throwError(() => err))
    );

  }

  register(fullName: string, email: string, password: string): Observable<User> {
    const url = `${API.BASE_URL}/Auth/register`;
    return this.http.post<User>(url, { fullName, email, password }).pipe(
      map(res => this.normalizeUser(res)),
      tap(user => {
        localStorage.setItem(`CURRENT_USER`, JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
      catchError(err => {
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('CURRENT_USER');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  private normalizeUser(res: any): User {
    return {
      id: res.user.userID,
      name: res.user.fullName,
      email: res.user.email,
      token: res.token
    };
  }

}

