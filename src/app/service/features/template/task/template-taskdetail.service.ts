import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/service/core/auth/auth.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TemplateTaskdetailService {

  private apiUrl = environment.Backend;
  private baseUrl = '/api/v1/template-tarea-detalles';

  constructor(private http: HttpClient, private authService: AuthService) { }

  listTemplateTaskDetails(templateTaskId: string): Observable<any[]> {
    const headers = this.authService.createHeaders();
    return this.http.get<any[]>(`${this.apiUrl}${this.baseUrl}/template/${templateTaskId}`, { headers });
  }

  createTemplateTaskDetail(templateTaskDetail: any): Observable<any> {
    const headers = this.authService.createHeaders();
    return this.http.post<any>(`${this.apiUrl}${this.baseUrl}`, templateTaskDetail, { headers });
  }

  editTemplateTaskDetail(templateTaskDetailId: string, templateTaskDetail: any): Observable<any> {
    const headers = this.authService.createHeaders();
    return this.http.put<any>(`${this.apiUrl}${this.baseUrl}/${templateTaskDetailId}`, templateTaskDetail, { headers });
  }

  deleteTemplateTaskDetail(templateTaskDetailId: string): Observable<any> {
    const headers = this.authService.createHeaders();
    return this.http.delete<any>(`${this.apiUrl}${this.baseUrl}/${templateTaskDetailId}`, { headers });
  }

}
