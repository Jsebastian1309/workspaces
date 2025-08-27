import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { UniqueIdService } from '../../core/utils/uniqueId.service';

@Injectable({
    providedIn: 'root'
})
export class FolderService {

    private apiUrl = environment.Backend;
    private baseUrl = '/proyCarpeta';

    constructor(private http: HttpClient, private authService: AuthService,private uniqueIdService: UniqueIdService) { }


    /**
     * Buscar un espacio de trabajo por espaciotrabajo y espacio
     */
    searchFoldersFiltered(espacioTrabajoIdentificador: string, espacioIdentificador?: string): Observable<any[]> {
        const headers = this.authService.createHeaders();
        const body: any = { espacioTrabajoIdentificador, espacioIdentificador: espacioIdentificador };
        return this.http.post<any>(`${this.apiUrl}${this.baseUrl}/buscarFiltrado`, body, { headers })
            .pipe(map((resp: any) => Array.isArray(resp) ? resp : (resp?.proyCarpetaList ?? [])));
    }


    /**
     * Crear una carpeta
     */
    createFolder(folder: any): Observable<any> {
        const headers = this.authService.createHeaders();
        const currentUser = this.authService.getCurrentUser();
        const identificador = this.uniqueIdService.generateId(folder.nombre);
        const workspaceData = {
            identificador: identificador,
            nombre: folder.nombre,
            organizacionId: currentUser?.organizacionId,
            clienteId: currentUser?.clienteId,
            descripcion: folder.descripcion,
            publico: folder.publico,
            estado: folder.estado,
            // usuario_creacion: currentUser.username,
            espacioIdentificador: folder.espacioIdentificador
        };
        return this.http.post<any>(`${this.apiUrl}${this.baseUrl}/crear`, workspaceData, {headers})
    }

    /**
     * editar una carpet
     */
    updateFolder(folder: any): Observable<any> {
        const headers = this.authService.createHeaders();
        const currentUser = this.authService.getCurrentUser();
        const workspaceData = {
            identificador: folder.identificador,
            nombre: folder.nombre,
            organizacionId: folder.organizacionId,
            clienteId: folder.clienteId,
            descripcion: folder.descripcion,
            publico: folder.publico,
            estado: folder.estado,
            // usuarioActualizacion: currentUser.username,
            espacioIdentificador: folder.espacioIdentificador
        };
        return this.http.put<any>(`${this.apiUrl}${this.baseUrl}/actualizar`, workspaceData, { headers });
    }

    /**
     * Eliminar una carpeta
     */
    deleteFolder(folder: any): Observable<any> {
        const headers = this.authService.createHeaders();
        return this.http.delete<any>(`${this.apiUrl}${this.baseUrl}/eliminar`, {headers,body: folder});
    }

}