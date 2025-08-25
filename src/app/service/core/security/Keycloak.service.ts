import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';

export interface KeycloakToken {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  scope: string;
}

export interface KeycloakTokenPayload {
  exp: number;
  preferred_username: string;
  name: string;
  email: string;
  Organizacion: string;
  Cliente: string;
  realm_access: {
    roles: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class KeycloakService {

  private readonly KeycloakUrl = environment.KeycloakUrl;
  private readonly realm = environment.realm;
  private readonly clienteid = environment.clienteid;

  private jwtHelper = new JwtHelperService();

  constructor(private http: HttpClient) { }

  getToken(username: string, password: string): Observable<KeycloakToken> {
    const tokenUrl = `${this.KeycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;
    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('client_id', this.clienteid);
    body.set('username', username);
    body.set('password', password);
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    return this.http.post<KeycloakToken>(tokenUrl, body.toString(), { headers })
      .pipe(
        catchError(error => {
          console.error('Error al obtener token de Keycloak:', error);
          return throwError(() => error);
        })
      );
  }

  decodeToken(token: string): KeycloakTokenPayload | null {
    try {
      if (this.jwtHelper.isTokenExpired(token)) {
        console.error('Token expirado');
        return null;
      }

      return this.jwtHelper.decodeToken(token) as KeycloakTokenPayload;
    } catch (error) {
      console.error('Error al decodificar token:', error);
      return null;
    }
  }


  isTokenValid(token: string): boolean {
    try {
      return !this.jwtHelper.isTokenExpired(token);
    } catch (error) {
      return false;
    }
  }


  getUserInfoFromToken(tokenPayload: KeycloakTokenPayload): {
    username: string;
    name: string;
    roles: string[];
    organizacion_id: string;
    cliente_id: string;
    email: string;
  } {
    return {
      username: tokenPayload.preferred_username,
      name: tokenPayload.name,
      roles: tokenPayload.realm_access?.roles || [],
      organizacion_id: tokenPayload.Organizacion,
      cliente_id: tokenPayload.Cliente,
      email: tokenPayload.email
    };
  }


  refreshToken(refreshToken: string): Observable<KeycloakToken> {
    const tokenUrl = `${this.KeycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;

    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('client_id', this.clienteid);
    body.set('refresh_token', refreshToken);

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    return this.http.post<KeycloakToken>(tokenUrl, body.toString(), { headers })
      .pipe(
        catchError(error => {
          console.error('Error al refrescar token:', error);
          return throwError(() => error);
        })
      );
  }


  logout(refreshToken: string): Observable<any> {
    const logoutUrl = `${this.KeycloakUrl}/realms/${this.realm}/protocol/openid-connect/logout`;

    const body = new URLSearchParams();
    body.set('client_id', this.clienteid);
    body.set('refresh_token', refreshToken);

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    return this.http.post(logoutUrl, body.toString(), { headers })
      .pipe(
        catchError(error => {
          console.error('Error al cerrar sesión en Keycloak:', error);
          return throwError(() => error);
        })
      );
  }
}
