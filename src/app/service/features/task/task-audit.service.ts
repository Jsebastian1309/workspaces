  import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/service/core/auth/auth.service';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class TaskAuditService {
  private apiUrl = environment.Backend;
  private baseUrl = '/api/v1/tarea-auditoria';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getTaskAudit(taskId: string): Observable<any[]> {
    const headers = this.authService.createHeaders();
    return this.http.get<any[]>(`${this.apiUrl}${this.baseUrl}/tarea/${taskId}`, { headers });
  }
}
