
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map, Observable, of } from "rxjs";
import { environment } from "src/environments/environment";
import { AuthService } from "../../core/auth/Auth.service";
import { UniqueIdService } from "../../core/utils/uniqueId.service";

@Injectable({
    providedIn: 'root',
})
export class SpaceService {

    private apiUrl = environment.Backend;
    private baseUrl = '/proyEspacio';

    constructor(private http: HttpClient, private authService: AuthService, private uniqueIdService: UniqueIdService) { }


    /**
     * Buscar espacios de trabajo filtrados
     */
    searchSpacesFiltered(espacioTrabajoIdentificador: string): Observable<any[]> {
        const headers = this.authService.createHeaders();
        const body: any = { espacioTrabajoIdentificador, publico: true };
        return this.http.post<any>(`${this.apiUrl}${this.baseUrl}/buscarFiltrado`, body, { headers }).pipe(
            map((resp: any) => Array.isArray(resp) ? resp : (resp?.proyEspacioList ?? []))
        );
    }


    /**
     * Crear un nuevo espacio de trabajo
     */
    CreateSpace(Space: any): Observable<any> {
        const headers = this.authService.createHeaders();
        const currentUser = this.authService.getCurrentUser();
        const identificador = this.uniqueIdService.generateId(Space.nombre);
        const workspaceData = {
            identificador,
            nombre: Space.nombre,
            categoria: Space.categoria,
            organizacionId: currentUser?.organizacionId,
            clienteId: currentUser?.clienteId,
            color: Space.color,
            icono: Space.icono,
            publico: Space.publico,
            estado: Space.estado,
            // usuario_creacion: currentUser?.username,
            descripcion: Space.descripcion,
            espacioTrabajoIdentificador: Space.espacioTrabajoIdentificador,
        };
        return this.http.post<any>(`${this.apiUrl}${this.baseUrl}/crear`, workspaceData, {headers});
    }


    /**
     * Actualizar un espacio existente
     */
    updateSpace(Space: any): Observable<any> {
        const headers = this.authService.createHeaders();
        const currentUser = this.authService.getCurrentUser();
        const username = currentUser?.username
        const payload = {
            identificador: Space.identificador,
            estado: Space.estado,
            nombre: Space.nombre,
            color: Space.color,
            icono: Space.icono,
            organizacionId: Space.organizacionId,
            clienteId: Space.clienteId,
            categoria: Space.categoria,
            publico: Space.publico,
            descripcion: Space.descripcion,
            espacioTrabajoIdentificador: Space.espacioTrabajoIdentificador
            // usuarioActualizacion: username
        };
        return this.http.put<any>(`${this.apiUrl}${this.baseUrl}/actualizar`, payload, { headers });
    }


    /**
     * Eliminar un espacio
     */
    deleteSpace(Space: any): Observable<any> {
        const headers = this.authService.createHeaders();
        const body = Space.identificador ? { identificador: Space.identificador } : Space;
        return this.http.delete<any>(`${this.apiUrl}${this.baseUrl}/eliminar`, { headers, body });
    }

}
