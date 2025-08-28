import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { Task } from '../../../models/task.model';
import { UniqueIdService } from '../../core/utils/uniqueId.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
    private apiUrl = environment.Backend;
    private baseUrl = '/proyTarea';

    constructor(private http: HttpClient, private authService: AuthService, private uniqueIdService: UniqueIdService) { }


    searchtaskFiltered(taskData: any): Observable<any[]> {
        const headers = this.authService.createHeaders();
        const body: any = {
            ...taskData
        };
        console.log('TaskService - searchtaskFiltered - body:', body);  
        return this.http.post<any[]>(`${this.apiUrl}${this.baseUrl}/buscarFiltrado`, body, { headers });
    }



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
        fechaInicio?: string; 
        fechaFin?: string;    
    }): Observable<Task[]> {
        const headers = this.authService.createHeaders();
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
     * Crear una Tarea
     */
    Createtask(worktask: any): Observable<any> {
        const headers =this.authService.createHeaders();
        const currentUser = this.authService.getCurrentUser();
        const identificador = this.uniqueIdService.generateId(worktask.nombre);
        const worktaskData = {  
            espacioTrabajoIdentificador: worktask.espacioTrabajoIdentificador,
            carpetaIdentificador: worktask.carpetaIdentificador,
            listaIdentificador: worktask.listaIdentificador,
            identificador: identificador,
            nombre: worktask.nombre,
            categoria: worktask.categoria,
            duracionHoras: worktask.duracionHoras,
            etiqueta: worktask.etiqueta,
            prioridad: worktask.prioridad,
            descripcion: worktask.descripcion,
            comentarios: worktask.comentarios,
            organizacionId: currentUser?.organizacionId,
            clienteId: currentUser?.clienteId,
            fechaCreacionTarea: worktask.fechaCreacionTarea,
            fechaInicio: worktask.fechaInicio,
            fechaFin: worktask.fechaFin,
            fechaTerminada: worktask.fechaTerminada,
            fechaCerrada: worktask.fechaCerrada,
            progreso: worktask.progreso,
            facturable: worktask.facturable,
            color: worktask.color,
            icono: worktask.icono,
            publico: worktask.publico,
            estado: worktask.estado,
            tipoTarea: "djisf",
            // usuario_creacion: currentUser?.username,
            
        };


        
        console.log('Enviando datos al backend:', worktaskData);
        
        return this.http.post<any>(`${this.apiUrl}${this.baseUrl}/crear`, worktaskData, { 
            headers,
            observe: 'response'
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
     * Actualizar una tarea existente
     */
    actualizarTarea(tarea: any): Observable<any> {
        const headers = this.authService.createHeaders();
        return this.http.put<any>(`${this.apiUrl}${this.baseUrl}/actualizar`, tarea, { headers });
    }

}
