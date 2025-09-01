import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/service/core/auth/auth.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TemplateStatusDetailService {
  private apiUrl = environment.Backend;
  private baseUrl = '/api/v1/template-estado-detalles';

  constructor(private http: HttpClient, private authService: AuthService) { }

  listTemplateStatusDetails(templateStatusId: any): Observable<any[]> {
    const headers = this.authService.createHeaders();
    return this.http.get<any[]>(`${this.apiUrl}${this.baseUrl}/template-estado/${templateStatusId}`, { headers });
  }

  createTemplateStatusDetail(templateStatusDetail: any): Observable<any> {
    const headers = this.authService.createHeaders();
    return this.http.post<any>(`${this.apiUrl}${this.baseUrl}`, templateStatusDetail, { headers });
  }

  editTemplateStatusDetail(templateStatusDetailId: string, templateStatusDetail: any): Observable<any> {
    const headers = this.authService.createHeaders();
    return this.http.put<any>(`${this.apiUrl}${this.baseUrl}/${templateStatusDetailId}`, templateStatusDetail, { headers });
  }

  deleteTemplateStatusDetail(templateStatusDetailId: string): Observable<any> {
    const headers = this.authService.createHeaders();
    return this.http.delete<any>(`${this.apiUrl}${this.baseUrl}/${templateStatusDetailId}`, { headers });
  }


}
