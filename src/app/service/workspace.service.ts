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
     * Crear headers con token de autorización
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
        return this.http.post<any>(`${this.apiUrl}${this.baseUrl}/crear`, workspace, { headers });
    }
}
