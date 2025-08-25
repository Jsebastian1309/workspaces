
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { AuthService } from "./AuthService.service";

@Injectable({
    providedIn: 'root',
})
export class SpaceService {

    private apiUrl = environment.Backend;
    private baseUrl = '/proyEspacio';

    constructor(private http: HttpClient, private authService: AuthService) { }



    listSpaces(): Observable<any[]> {
        const headers = this.authService.createHeaders();
        return this.http.get<any[]>(`${this.apiUrl}${this.baseUrl}/listar`,{ headers });
    }

    listSpacesByWorkspace(espacioTrabajoIdentificador: string): Observable<any[]> {
        const headers = this.authService.createHeaders();
        return this.http.get<any[]>(`${this.apiUrl}${this.baseUrl}/listar?espacioTrabajoIdentificador=${espacioTrabajoIdentificador}`, { headers });
    }


    searchSpacesFiltered(espacioTrabajoIdentificador: string): Observable<any[]> {
        const headers =this.authService.createHeaders();
        const body: any = {
            espacioTrabajoIdentificador,
            publico: true
        };
        return this.http.post<any[]>(`${this.apiUrl}${this.baseUrl}/buscarFiltrado`, body, { headers });
    }

    /**
     * Buscar un espacio de trabajo por identificador
     */
    Searchspace(identificador: string): Observable<any> {
        const headers = this.authService.createHeaders();
        return this.http.get<any>(`${this.apiUrl}${this.baseUrl}/buscar/${identificador}`, { headers });
    }

    /**
     * Crear un nuevo espacio de trabajo
     */
    CreateSpace(workspace: any): Observable<any> {
        const headers = this.authService.createHeaders();
        
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
            organizacionId: currentUser?.organizacion_id,
            clienteId: currentUser?.cliente_id,
            color: workspace.color,
            icono: workspace.icono,
            publico: workspace.publico,
            estado: workspace.estado,
            usuario_creacion: currentUser?.username,
            // Identificadores del workspace padre
            espacioTrabajoId:"10",
            espacioTrabajoIdentificador: workspace.espacioTrabajoIdentificador,
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
     * Actualizar un espacio existente
     */
    updateSpace(space: any): Observable<any> {
        const headers = this.authService.createHeaders();
        const payload = {
            identificador: space.identificador,
            estado: space.estado,
            nombre: space.nombre,
            color: space.color,
            icono: space.icono,
            organizacionId: space.organizacionId,
            clienteId: space.clienteId,
            categoria: space.categoria,
            publico: space.publico,
            descripcion: space.descripcion,
            espacioTrabajoIdentificador: space.espacioTrabajoIdentificador
        };
        return this.http.put<any>(`${this.apiUrl}${this.baseUrl}/actualizar`, payload, { headers });
    }

    /**
     * Eliminar un espacio
     */
    deleteSpace(space: any): Observable<any> {
        const headers = this.authService.createHeaders();
        const body = space.identificador ? { identificador: space.identificador } : space;
        return this.http.delete<any>(`${this.apiUrl}${this.baseUrl}/eliminar`, { headers, body });
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
