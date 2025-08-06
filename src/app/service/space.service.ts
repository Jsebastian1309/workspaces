import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { AuthService } from "./AuthService.service";

@Injectable({
    providedIn: 'root',
})
export class WorkspaceService {

    private apiUrl = environment.Backend;
    private baseUrl = '/proyEspacio';

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
        
        // Generar un identificador único para el workspace
        const identificador = this.generateWorkspaceId(workspace.nombre);
        
        // Preparar el objeto con la información del usuario y organizacion
        // Mapear los nombres de los campos al formato que espera el backend
        const workspaceData = {
            identificador: identificador,
            nombre: workspace.nombre,
            categoria: workspace.categoria,
            organizacionId: currentUser?.organizacion_id || workspace.organizacion_id,
            clienteId: currentUser?.cliente_id || workspace.cliente_id,
            color: workspace.color,
            icono: workspace.icono,
            publico: workspace.publico,
            estado: workspace.estado,
            usuario_creacion: currentUser?.username || 'unknown'
        };
        
        console.log('Enviando datos al backend:', workspaceData);
        
        return this.http.post<any>(`${this.apiUrl}${this.baseUrl}/crear`, workspaceData, { 
            headers,
            observe: 'response' // Para obtener la respuesta completa con status
        }).pipe(
            map((response: any) => {
                console.log('Respuesta completa del backend:', response);
                return response.body;
            }),
            catchError((error: any) => {
                console.error('Error detallado del backend:', error);
                // Si es un error 200/201 pero con contenido de error, lo tratamos como éxito
                if (error.status === 200 || error.status === 201) {
                    console.log('Tratando respuesta como exitosa a pesar del status');
                    return of(error.error);
                }
                throw error;
            })
        );
    }

    /**
     * Generar un identificador único para el workspace basado en el nombre
     */
    private generateWorkspaceId(nombre: string): string {
        const timestamp = Date.now();
        const nombreLimpio = nombre.toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
        return `ws_${nombreLimpio}_${timestamp}`;
    }
}
