import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { User } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  currentUser$ = this.currentUserSubject.asObservable();

  private getStoredUser(): User | null {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  }

  login(email: string, password: string): Observable<User> {
    const mockUser: User = {
      id: 'user-' + Math.random().toString(36).substr(2, 9),
      name: email.split('@')[0],
      email,
      token: 'mock-token-' + Math.random().toString(36).substr(2, 16)
    };
    return of(mockUser).pipe(
      delay(700),
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  register(name: string, email: string, password: string): Observable<User> {
    const mockUser: User = {
      id: 'user-' + Math.random().toString(36).substr(2, 9),
      name,
      email,
      token: 'mock-token-' + Math.random().toString(36).substr(2, 16)
    };
    return of(mockUser).pipe(
      delay(700),
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }
}

