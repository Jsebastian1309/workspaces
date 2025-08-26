import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { AuthService } from "../../core/auth/Auth.service";
import { UniqueIdService } from "../../core/utils/uniqueId.service";

@Injectable({
    providedIn: 'root',
})
export class WorkspaceService {

    private apiUrl = environment.Backend;
    private baseUrl = '/proyEspacioTrabajo';

    constructor(private http: HttpClient, private authService: AuthService, private uniqueIdService: UniqueIdService) { }
    
    /**
     * Listar todos los espacios de trabajo
     */
    listWorkSpaces(): Observable<any[]> {
        const headers = this.authService.createHeaders();
        return this.http.get<any[]>(`${this.apiUrl}${this.baseUrl}/listar`,{ headers });
    }

    /**
     * Buscar un espacio de trabajo por identificador
     */
    SearchWorkSpace(identificador: string): Observable<any> {
        const headers = this.authService.createHeaders();
        return this.http.get<any>(`${this.apiUrl}${this.baseUrl}/buscar/${identificador}`, { headers });
    }

    /**
     * Crear un nuevo espacio de trabajo
     */
    CreateWorkSpace(workspace: any): Observable<any> {
        const headers = this.authService.createHeaders();
        const currentUser = this.authService.getCurrentUser();
        const identificador = this.uniqueIdService.generateId(workspace?.nombre);   
        const workspaceData = {
            identificador,
            nombre: workspace.nombre,
            categoria: workspace.categoria,
            color: workspace.color,
            icono: workspace.icono,
            publico: workspace.publico,
            estado: workspace.estado,
            // usuario_creacion: currentUser?.username,
            organizacionId: currentUser?.organizacionId,
            clienteId: currentUser?.clienteId
        };
        return this.http.post<any>(`${this.apiUrl}${this.baseUrl}/crear`, workspaceData, { headers });
    }

    /**
     * Actualizar un espacio de trabajo existente
     */
    UpdateWorkSpace(workspace: any): Observable<any> {
        const headers = this.authService.createHeaders();
        const currentUser = this.authService.getCurrentUser();
        const username = currentUser?.username
        const workspaceData = {
            identificador: workspace.identificador,
            estado: workspace.estado,
            nombre: workspace.nombre,
            color: workspace.color,
            icono: workspace.icono,
            organizacionId: workspace.organizacionId,
            clienteId: workspace.clienteId,
            categoria: workspace.categoria,
            publico: workspace.publico,
            // usuarioActualizacion: username
        };
        return this.http.put<any>(`${this.apiUrl}${this.baseUrl}/actualizar`, workspaceData, { headers });
    }

    /**
     * Eliminar un espacio de trabajo
     */
    DeleteWorkSpace(workspace: any): Observable<any> {
        const headers = this.authService.createHeaders();
        return this.http.delete<any>(`${this.apiUrl}${this.baseUrl}/eliminar`, {headers,body: workspace});
    }
}
