import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, timer, Subscription } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { KeycloakService } from './keycloak.service';
import { HttpHeaders } from '@angular/common/http';
export interface User {
  username: string;
  name: string;
  roles: string[];
  organizacion_id: string;
  cliente_id: string;
  email?: string;
}
export interface UserContext {
  user: User;
  session: {
    loginTime: Date;
    lastActivity: Date;
    expirationTime: Date;
  };
  keycloakToken: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    refresh_expires_in: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private readonly MAX_INACTIVITY_TIME = 30 * 60 * 1000;
  private readonly TOKEN_REFRESH_BUFFER = 5 * 60 * 1000;
  private inactivityTimer: Subscription | null = null;
  private tokenRefreshTimer: Subscription | null = null;

  constructor(private keycloakService: KeycloakService) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const savedUserContext = localStorage.getItem('userContext');
    if (savedUserContext) {
      try {
        const userContext: UserContext = JSON.parse(savedUserContext);
        if (this.isSessionExpired(userContext)) {
          this.logout();
          return;
        }
        this.currentUserSubject.next(userContext.user);
        this.updateLastActivity();
        this.scheduleTokenRefresh(userContext);
      } catch (error) {
        this.logout();
      }
    }
  }


  private isSessionExpired(userContext: UserContext): boolean {
    const now = new Date().getTime();
    const expirationTime = new Date(userContext.session.expirationTime).getTime();
    const lastActivity = new Date(userContext.session.lastActivity).getTime();
    return now > expirationTime || (now - lastActivity) > this.MAX_INACTIVITY_TIME;
  }

  private scheduleTokenRefresh(userContext: UserContext): void {
    if (this.tokenRefreshTimer) {
      this.tokenRefreshTimer.unsubscribe();
    }
    const now = new Date().getTime();
    const expirationTime = new Date(userContext.session.expirationTime).getTime();
    const timeUntilRefresh = Math.max(0, expirationTime - now - this.TOKEN_REFRESH_BUFFER);
    if (timeUntilRefresh > 0) {
      this.tokenRefreshTimer = timer(timeUntilRefresh).subscribe(() => {
        this.refreshKeycloakToken().subscribe({
          next: (success) => {
            if (!success) {
              this.logout();
            }
          },
          error: () => {
            this.logout();
          }
        });
      });
    }
  }

  login(username: string, password: string): Observable<boolean> {
    return this.keycloakService.getToken(username, password).pipe(
      map(tokenResponse => {
        const tokenPayload = this.keycloakService.decodeToken(tokenResponse.access_token);
        if (tokenPayload) {
          const userInfo = this.keycloakService.getUserInfoFromToken(tokenPayload);
          const authenticatedUser: User = {
            username: userInfo.username,
            name: userInfo.name,
            roles: userInfo.roles,
            organizacion_id: userInfo.organizacion_id,
            cliente_id: userInfo.cliente_id,
            email: userInfo.email
          };

          const now = new Date();
          const expirationTime = new Date(now.getTime() + (tokenResponse.expires_in * 1000));
          const userContext: UserContext = {
            user: authenticatedUser,
            session: {
              loginTime: now,
              lastActivity: now,
              expirationTime: expirationTime
            },
            keycloakToken: {
              access_token: tokenResponse.access_token,
              refresh_token: tokenResponse.refresh_token,
              expires_in: tokenResponse.expires_in,
              refresh_expires_in: tokenResponse.refresh_expires_in
            }
          };

          localStorage.setItem('userContext', JSON.stringify(userContext));
          this.currentUserSubject.next(authenticatedUser);
          this.scheduleTokenRefresh(userContext);

          return true;
        }
        return false;
      }),
      catchError(error => {
        return of(false);
      })
    );
  }

  logout(): void {
    if (this.inactivityTimer) {
      this.inactivityTimer.unsubscribe();
      this.inactivityTimer = null;
    }
    if (this.tokenRefreshTimer) {
      this.tokenRefreshTimer.unsubscribe();
      this.tokenRefreshTimer = null;
    }

    localStorage.removeItem('userContext');
    this.currentUserSubject.next(null);
  }

  updateLastActivity(): void {
    const savedUserContext = localStorage.getItem('userContext');
    if (savedUserContext && this.currentUserSubject.value) {
      try {
        const userContext: UserContext = JSON.parse(savedUserContext);
        userContext.session.lastActivity = new Date();
        localStorage.setItem('userContext', JSON.stringify(userContext));
      } catch (error) {
      }
    }
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }


  getOrganizacionId(): string | undefined {
    return this.currentUserSubject.value?.organizacion_id;
  }

  getClienteId(): string | undefined {
    return this.currentUserSubject.value?.cliente_id;
  }

  getUserContext(): { org_id: string, cliente_id: string } | null {
    const user = this.currentUserSubject.value;
    if (user) {
      return {
        org_id: user.organizacion_id,
        cliente_id: user.cliente_id,
      };
    }
    return null;
  }

  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return user ? user.roles.includes(role) : false;
  }

  getKeycloakToken(): string | null {
    const savedUserContext = localStorage.getItem('userContext');
    if (savedUserContext) {
      try {
        const userContext: UserContext = JSON.parse(savedUserContext);
        if (userContext.keycloakToken) {
          return userContext.keycloakToken.access_token;
        }
      } catch (error) {
      }
    }
    return null;
  }

  refreshKeycloakToken(): Observable<boolean> {
    const savedUserContext = localStorage.getItem('userContext');
    if (savedUserContext) {
      try {
        const userContext: UserContext = JSON.parse(savedUserContext);
        if (userContext.keycloakToken?.refresh_token) {
          return this.keycloakService.refreshToken(userContext.keycloakToken.refresh_token).pipe(
            map(tokenResponse => {
              const now = new Date();
              const expirationTime = new Date(now.getTime() + (tokenResponse.expires_in * 1000));

              userContext.keycloakToken = {
                access_token: tokenResponse.access_token,
                refresh_token: tokenResponse.refresh_token,
                expires_in: tokenResponse.expires_in,
                refresh_expires_in: tokenResponse.refresh_expires_in
              };

              userContext.session.expirationTime = expirationTime;
              userContext.session.lastActivity = now;

              localStorage.setItem('userContext', JSON.stringify(userContext));
              this.scheduleTokenRefresh(userContext);
              return true;
            }),
            catchError(error => {
              this.logout();
              return of(false);
            })
          );
        }
      } catch (error) {
      }
    }
    return of(false);
  }

  getAuthHeaders(): { [key: string]: string } {
    const user = this.currentUserSubject.value;
    const headers: { [key: string]: string } = {};
    if (user) {
      headers['X-User-Id'] = user.username;
      headers['X-Org-Id'] = user.organizacion_id;
      headers['X-Cliente-Id'] = user.cliente_id;
    }

    const keycloakToken = this.getKeycloakToken();
    if (keycloakToken) {
      headers['Authorization'] = `Bearer ${keycloakToken}`;
    }
    return headers;
  }
  getKeycloakAuthHeaders(): { [key: string]: string } {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    const keycloakToken = this.getKeycloakToken();
    if (keycloakToken) {
      headers['Authorization'] = `Bearer ${keycloakToken}`;
    }
    return headers;
  }
  getSessionInfo(): { timeRemaining: number; isExpiringSoon: boolean; lastActivity: Date } | null {
    const savedUserContext = localStorage.getItem('userContext');
    if (savedUserContext && this.currentUserSubject.value) {
      try {
        const userContext: UserContext = JSON.parse(savedUserContext);
        const now = new Date().getTime();
        const expirationTime = new Date(userContext.session.expirationTime).getTime();
        const timeRemaining = Math.max(0, expirationTime - now);
        const isExpiringSoon = timeRemaining < this.TOKEN_REFRESH_BUFFER;

        return {
          timeRemaining,
          isExpiringSoon,
          lastActivity: new Date(userContext.session.lastActivity)
        };
      } catch (error) {
      }
    }
    return null;
  }

  isSessionValid(): boolean {
    const token = this.getKeycloakToken();
    if (!token) return false;

    return this.keycloakService.isTokenValid(token) && this.isAuthenticated();
  }

  getTimeUntilExpiration(): number {
    const sessionInfo = this.getSessionInfo();
    return sessionInfo ? sessionInfo.timeRemaining : 0;
  }


  extendSession(): Observable<boolean> {
    return this.refreshKeycloakToken();
  }

  createHeaders(): HttpHeaders {
    const token = this.getKeycloakToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }
}
