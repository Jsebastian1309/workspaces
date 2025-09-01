import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/service/core/auth/auth.service';
import { environment } from 'src/environments/environment';
import { UniqueIdService } from 'src/app/service/core/utils/uniqueId.service';

@Injectable({
  providedIn: 'root'
})
export class TemplateTaskService {
   private apiUrl = environment.Backend;
  private baseUrl = '/api/v1/template-tareas';

  constructor(private http: HttpClient, private authService: AuthService, private uniqueIdService: UniqueIdService) { }

  listTemplateTasks(): Observable<any[]> {
    const headers = this.authService.createHeaders();
    return this.http.get<any[]>(`${this.apiUrl}${this.baseUrl}`, { headers });
  }

  createTemplateTask(template: any): Observable<any> {
    const headers = this.authService.createHeaders();
    const currentUser = this.authService.getCurrentUser();
    
    // Build the full template object with required fields
    const templateData = {
      identificador: this.uniqueIdService.generateId(template.nombre),
      nombre: template.nombre,
      estado: template.estado || 'ACTIVE',
      organizacionId: currentUser?.organizacionId,
      clienteId: currentUser?.clienteId
    };
    
    return this.http.post<any>(`${this.apiUrl}${this.baseUrl}`, templateData, { headers });
  }

  editTemplateTask(templateId: string, template: any): Observable<any> {
    const headers = this.authService.createHeaders();
    const currentUser = this.authService.getCurrentUser();
    
    // Ensure organizacionId and clienteId are included if updating
    const templateData = {
      ...template,
      organizacionId: currentUser?.organizacionId,
      clienteId: currentUser?.clienteId
    };
    
    return this.http.put<any>(`${this.apiUrl}${this.baseUrl}/${templateId}`, templateData, { headers });
  }

  deleteTemplateTask(templateId: string): Observable<any> {
    const headers = this.authService.createHeaders();
    return this.http.delete<any>(`${this.apiUrl}${this.baseUrl}/${templateId}`, { headers });
  }

  getTemplateTask(templateId: string): Observable<any> {
    const headers = this.authService.createHeaders();
    return this.http.get<any>(`${this.apiUrl}${this.baseUrl}/${templateId}`, { headers });
  }

}