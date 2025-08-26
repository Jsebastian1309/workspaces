import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../core/auth/Auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { Task } from '../../../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = environment.Backend;
    private baseUrl = '/proyTarea';

    constructor(private http: HttpClient, private authService: AuthService) { }

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

    listtask(): Observable<any[]> {
        const headers = this.createHeaders();
        return this.http.get<any[]>(`${this.apiUrl}${this.baseUrl}/listar`,{ headers });
    }

    listtaskByWorktask(espacioTrabajoIdentificador: string): Observable<any[]> {
        const headers = this.createHeaders();
        return this.http.get<any[]>(`${this.apiUrl}${this.baseUrl}/listar?espacioTrabajoIdentificador=${espacioTrabajoIdentificador}`, { headers });
    }


    searchtaskFiltered(espacioTrabajoIdentificador: string): Observable<any[]> {
        const headers = this.createHeaders();
        const body: any = {
            espacioTrabajoIdentificador,
            publico: true
        };
        return this.http.post<any[]>(`${this.apiUrl}${this.baseUrl}/buscarFiltrado`, body, { headers });
    }

    /**
     * Buscar tareas por lista (list) para alimentar la vista agrupada
     */
    searchTasksByList(listaIdentificador: string): Observable<Task[]> {
        const headers = this.createHeaders();
        const body: any = { listaIdentificador };
        return this.http.post<Task[] | any>(`${this.apiUrl}${this.baseUrl}/buscarFiltrado`, body, { headers }).pipe(
            map(resp => this.ensureArray(resp).map((t: any) => this.mapBackendTask(t)))
        );
    }

    /**
     * Buscar tareas filtradas con los campos exactos provistos:
     * {
     *   espacioTrabajoIdentificador, espacio_identificador, carpeta_identificador,
     *   listaIdentificador, tipoTarea, etiqueta, prioridad
     * }
     */
    searchTasksFiltered(params: {
        espacioTrabajoIdentificador?: string;
        espacio_identificador?: string;
        carpeta_identificador?: string;
        lista_identificador?: string;
        tipoTarea?: string;
        etiqueta?: string;
        prioridad?: string;
        categoria?: string;
        estado?: string;
        fechaInicio?: string; // YYYY-MM-DD
        fechaFin?: string;    // YYYY-MM-DD
    }): Observable<Task[]> {
        const headers = this.createHeaders();
        
        // Limpiar parámetros - solo incluir los que tienen valores válidos
        const body: any = {};
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                body[key] = value;
            }
        });
        
        console.log('Parámetros originales:', params);
        console.log('Enviando al backend searchTasksFiltered (limpio):', body);
        
        return this.http.post<Task[] | any>(`${this.apiUrl}${this.baseUrl}/buscarFiltrado`, body, { headers }).pipe(
            map(resp => {
                console.log('Respuesta cruda del backend:', resp);
                const arrayData = this.ensureArray(resp);
                console.log('Array extraído:', arrayData);
                const mappedTasks = arrayData.map((t: any) => this.mapBackendTask(t));
                console.log('Tareas mapeadas:', mappedTasks);
                return mappedTasks;
            })
        );
    }

    private normalizeStatus(status?: string): string | undefined {
        if (!status) return status;
        const s = String(status).toUpperCase();
        console.log('Normalizando estado:', status, 'a:', s);
        
        if (/(BLOCK|BLOQUE)/.test(s)) return 'BLOCKED';
        if (/(PEND|PENDIENTE)/.test(s)) return 'PENDING';
        if (/(OPEN|ABIERT|NUEVO|NEW)/.test(s)) return 'OPEN';
        if (/(DONE|CLOSED|CERRAD|COMPLETAD|TERMINAD|FINALIZ)/.test(s)) return 'DONE';
        
        // Si no coincide con ningún patrón, retornar el estado original en mayúsculas
        console.log('Estado no reconocido, retornando:', s);
        return s;
    }

    private ensureArray(resp: any): any[] {
        if (Array.isArray(resp)) return resp;
        if (!resp) return [];
        // Look for common array containers
        const candidates = [
            'proyTareaList','data','items','lista','list','results','resultados','registros','content','contenido','rows','tareas','tasks'
        ];
        for (const key of candidates) {
            const val = (resp as any)[key];
            if (Array.isArray(val)) return val;
        }
        // If it's an object and looks like a single task, return as single-element array
        if (typeof resp === 'object') return [resp];
        return [];
    }

    private mapBackendTask(t: any): Task {
        // Preserve original backend label in estadoLabel; normalize estado to grouping key
        const label = t?.estado || t?.status || '';
        const normalized = this.normalizeStatus(label) || 'OPEN';
        const due = t?.fechaFin || t?.fechaVencimiento || t?.fechaTerminada;
        const assigned = t?.responsableIdentificador || t?.responsable || t?.asignadoA;
        return {
            ...t,
            estado: normalized,
            estadoLabel: label,
            fechaVencimiento: due,
            asignadoA: assigned,
        } as Task;
    }

    /**
     * Buscar un espacio de trabajo por identificador
     */
    Searchtask(identificador: string): Observable<any> {
        const headers = this.createHeaders();
        return this.http.get<any>(`${this.apiUrl}${this.baseUrl}/buscar/${identificador}`, { headers });
    }

        /** Crear una tarea (proyTarea) */
        crearTarea(tarea: any): Observable<any> {
            const headers = this.createHeaders();
            return this.http.post<any>(`${this.apiUrl}${this.baseUrl}/crear`, tarea, { headers });
        }

        /** Crear bitácora de tarea (proyBitacora) */
        crearBitacora(bitacora: any): Observable<any> {
            const headers = this.createHeaders();
            return this.http.post<any>(`${this.apiUrl}/proyBitacora/crear`, bitacora, { headers });
        }

    /**
     * Crear un nuevo espacio de trabajo
     */
    Createtask(worktask: any): Observable<any> {
        const headers = this.createHeaders();
        
        // Obtener información del usuario logueado
        const currentUser = this.authService.getCurrentUser();
        
        // Generar un identificador único para el worktask
        const identificador = this.generateWorktaskId(worktask.nombre);
        
        // Preparar el objeto con la información del usuario y organizacion
        // Mapear los nombres de los campos al formato que espera el backend
        const worktaskData = {
            identificador: identificador,
            nombre: worktask.nombre,
            categoria: worktask.categoria,
            organizacionId: currentUser?.organizacionId,
            clienteId: currentUser?.clienteId,
            color: worktask.color,
            icono: worktask.icono,
            publico: worktask.publico,
            estado: worktask.estado,
            usuario_creacion: currentUser?.username,
            // Identificadores del worktask padre
            espacioTrabajoId:"10",
            espacioTrabajoIdentificador: worktask.espacioTrabajoIdentificador,
        };
        
        console.log('Enviando datos al backend:', worktaskData);
        
        return this.http.post<any>(`${this.apiUrl}${this.baseUrl}/crear`, worktaskData, { 
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
     * Generar un identificador único para el worktask basado en el nombre
     */
    private generateWorktaskId(nombre: string): string {
        const timestamp = Date.now();
        const nombreLimpio = nombre.toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
        return `ws_${nombreLimpio}_${timestamp}`;
    }
}
