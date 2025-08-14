import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { AuthService } from "./AuthService.service";

@Injectable({
    providedIn: 'root',
})
export class WorkspaceService {

    private apiUrl = environment.Backend;
    private baseUrl = '/proyEspacioTrabajo';

    constructor(private http: HttpClient, private authService: AuthService) { }

    /**
     * Crear headers con token de autorización y información del usuario
     */
    private createHeaders(): HttpHeaders {
        const token = this.authService.getKeycloakToken();
        let headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });
        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
    }

    /**
     * Listar todos los espacios de trabajo
     */
    listWorkSpaces(): Observable<any[]> {
        const headers = this.createHeaders();
        return this.http.get<any[]>(`${this.apiUrl}${this.baseUrl}/listar`,{ headers });
    }

    /**
     * Buscar un espacio de trabajo por identificador
     */
    SearchWorkSpace(identificador: string): Observable<any> {
        const headers = this.createHeaders();
        return this.http.get<any>(`${this.apiUrl}${this.baseUrl}/buscar/${identificador}`, { headers });
    }

    /**
     * Crear un nuevo espacio de trabajo
     */
    CreateWorkSpace(workspace: any): Observable<any> {
        const headers = this.createHeaders();
        
        // Obtener información del usuario logueado
        const currentUser = this.authService.getCurrentUser();
        
        // Preparar el objeto con la información del usuario y organizacion
        const workspaceData = {
            ...workspace,
            usuario_creacion: currentUser?.username || 'unknown',
            organizacion_id: currentUser?.organizacion_id || workspace.organizacion_id,
            cliente_id: currentUser?.cliente_id || workspace.cliente_id
        };
        
        return this.http.post<any>(`${this.apiUrl}${this.baseUrl}/crear`, workspaceData, { headers });
    }

    /**
     * Actualizar un espacio de trabajo existente
     */
    UpdateWorkSpace(workspace: any): Observable<any> {
        const currentUser = this.authService.getCurrentUser();
        const username = currentUser?.username || 'system';
        
        // Crear headers con información de auditoría
        let headers = this.createHeaders();
        headers = headers.set('X-Usuario-Actualizacion', username);
        headers = headers.set('X-Fecha-Actualizacion', new Date().toISOString());
        
        console.log('Usuario actual:', currentUser);
        console.log('Username para auditoría:', username);
        
        // NO enviar campos de auditoría en el body ya que tienen @JsonIgnore
        const workspaceData = {
            identificador: workspace.identificador,
            estado: workspace.estado,
            nombre: workspace.nombre,
            descripcion: workspace.descripcion || '',
            color: workspace.color,
            icono: workspace.icono,
            organizacionId: workspace.organizacionId || workspace.organizacion_id,
            clienteId: workspace.clienteId || workspace.cliente_id,
            espacioTrabajoId: workspace.espacioTrabajoId || 10,
            espacioTrabajoIdentificador: workspace.espacioTrabajoIdentificador || workspace.identificador,
            publico: workspace.publico === true || workspace.publico === 'true',
            categoria: workspace.categoria,
            usuarioActualizacion: username

        };
        
        console.log('Datos enviados al backend para actualizar:', workspaceData);
        
        return this.http.put<any>(`${this.apiUrl}${this.baseUrl}/actualizar`, workspaceData, { headers });
    }
}
