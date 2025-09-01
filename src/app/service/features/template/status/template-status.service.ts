import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/service/core/auth/auth.service';
import { UniqueIdService } from 'src/app/service/core/utils/uniqueId.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TemplateStatusService {

  private apiUrl = environment.Backend;
  private baseUrl = '/api/v1/template-estados';

  constructor(private http: HttpClient, private authService: AuthService, private uniqueIdService: UniqueIdService) { }


  listTemplateStatus(): Observable<any[]> {
    const headers = this.authService.createHeaders();
    return this.http.get<any[]>(`${this.apiUrl}${this.baseUrl}`, { headers });
  }

  createTemplateStatus(template: any): Observable<any> {
    const headers = this.authService.createHeaders();
    const currentUser = this.authService.getCurrentUser();
    const templateData = {
      identificador: this.uniqueIdService.generateId(template.nombre),
      nombre: template.nombre,
      organizacionId: currentUser?.organizacionId,
      clienteId: currentUser?.clienteId
    };
    
    return this.http.post<any>(`${this.apiUrl}${this.baseUrl}`, templateData, { headers });
  }

  editTemplateStatus(templateId: string, template: any): Observable<any> {
    const headers = this.authService.createHeaders();
    const currentUser = this.authService.getCurrentUser();
    const templateData = {
      ...template,
      organizacionId: currentUser?.organizacionId,
      clienteId: currentUser?.clienteId
    };
    
    return this.http.put<any>(`${this.apiUrl}${this.baseUrl}/${templateId}`, templateData, { headers });
  }

  deleteTemplateStatus(templateId: string): Observable<any> {
    const headers = this.authService.createHeaders();
    return this.http.delete<any>(`${this.apiUrl}${this.baseUrl}/${templateId}`, { headers });
  }

  getTemplateStatus(templateId: string): Observable<any> {
    const headers = this.authService.createHeaders();
    return this.http.get<any>(`${this.apiUrl}${this.baseUrl}/${templateId}`, { headers });
  }

}