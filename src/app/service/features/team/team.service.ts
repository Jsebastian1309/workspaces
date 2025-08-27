import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { UniqueIdService } from '../../core/utils/uniqueId.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
    private apiUrl = environment.Backend;
    private baseUrl = '/proyEquipo';

    constructor(private http: HttpClient, private authService: AuthService, private uniqueIdService: UniqueIdService) { }

    /**
     * Listar todos los equipos
     */
    listTeam(): Observable<any[]> {
        const headers = this.authService.createHeaders();
        return this.http.get<any[]>(`${this.apiUrl}${this.baseUrl}/listar`,{ headers });
    }

    /**
     * Buscar un equipo por identificador
     */
    SearchTeam(identificador: string): Observable<any> {
        const headers = this.authService.createHeaders();
        return this.http.get<any>(`${this.apiUrl}${this.baseUrl}/buscar/${identificador}`, { headers });
    }

    /**
     * Crear un nuevo equipo
     */
    CreateTeam(team: any): Observable<any> {
        const headers = this.authService.createHeaders();
        const currentUser = this.authService.getCurrentUser();
        const identificador = this.uniqueIdService.generateId(team?.nombres);
        const TeamData = {
            identificador,
            nombres: team.nombres,
            apellidos: team.apellidos,
            correo: team.correo,
            celular: team.celular,
            valorHora: team.valorHora,
            estado: team.estado,
            // jefeIdentificador: team.jefeIdentificador,
            // usuario_creacion: currentUser?.username,
            organizacionId: currentUser?.organizacionId,
            clienteId: currentUser?.clienteId
        };
        return this.http.post<any>(`${this.apiUrl}${this.baseUrl}/crear`, TeamData, { headers });
    }

    /**
     * Actualizar un equipo existente
     */
    UpdateWorkSpace(team: any): Observable<any> {
        const headers = this.authService.createHeaders();
        const currentUser = this.authService.getCurrentUser();
        const username = currentUser?.username
        const workspaceData = {
            identificador: team.identificador,
            estado: team.estado,
            nombres: team.nombres,
            apellidos: team.apellidos,
            correo: team.correo,
            celular: team.celular,
            valorHora: team.valorHora,
            // jefeIdentificador: team.jefeIdentificador,
            organizacionId: team.organizacionId,
            clienteId: team.clienteId,
            // usuarioActualizacion: username
        };
        return this.http.put<any>(`${this.apiUrl}${this.baseUrl}/actualizar`, workspaceData, { headers });
    }

    /**
     * Eliminar un espacio de trabajo
     */
    DeleteWorkSpace(team: any): Observable<any> {
        const headers = this.authService.createHeaders();
        return this.http.delete<any>(`${this.apiUrl}${this.baseUrl}/eliminar`, {headers,body: team});
    }

}
