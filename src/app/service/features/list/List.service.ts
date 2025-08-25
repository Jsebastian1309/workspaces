import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../core/auth/Auth.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ListService {
   private apiUrl = environment.Backend;
      private baseUrl = '/proyLista';
  
      constructor(private http: HttpClient, private authService: AuthService) { }



      /**
       * Crear una nueva lista
       * Espera datos mínimos desde el formulario y hereda IDs del folder seleccionado
       */
      createList(payload: any): Observable<any> {
        const headers = this.authService.createHeaders();

        const currentUser = this.authService.getCurrentUser();

        const identificador = payload.identificador || this.generateIdFromName(payload.nombre);

        const listData = {
          identificador: identificador,
          estado: payload.estado ?? 'Activo',
          nombre: payload.nombre,
          descripcion: payload.descripcion,
          organizacionId: payload.organizacionId || currentUser?.organizacionId,
          clienteId: payload.clienteId || currentUser?.clienteId,
          carpetaIdentificador: payload.carpetaIdentificador,
          carpetaId: payload.carpetaId,
          publico: payload.publico
        };

        return this.http.post<any>(`${this.apiUrl}${this.baseUrl}/crear`, listData, {
          headers,
          observe: 'response'
        }).pipe(
          map((response: any) => response.body),
          catchError((error: any) => {
            // Algunos backends devuelven contenido en error con 200/201
            if (error.status === 200 || error.status === 201) {
              return of(error.error);
            }
            throw error;
          })
        );
      }

      /**
       * Buscar listas filtradas por carpetaIdentificador
       */
      searchListsFiltered(carpetaIdentificador: string): Observable<any[]> {
        const headers = this.authService.createHeaders();
        const body: any = {
          paginador: 'Y', offset: 0, limit: 100, campoOrder: '', direccionOrder: '', estado: 'Activo',
          carpetaIdentificador,
          publico: true
        };
        return this.http
          .post<any>(`${this.apiUrl}${this.baseUrl}/buscarFiltrado`, body, { headers })
          .pipe(map((resp: any) => Array.isArray(resp) ? resp : (resp?.proyListaList ?? [])));
      }

      /**
       * Generar un identificador único para la lista basado en el nombre
       */
      private generateIdFromName(nombre: string): string {
        const timestamp = Date.now();
        const nombreLimpio = (nombre || '')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
        return `ls_${nombreLimpio}_${timestamp}`;
      }
}
