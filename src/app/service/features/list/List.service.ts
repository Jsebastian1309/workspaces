import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UniqueIdService } from '../../core/utils/uniqueId.service';

@Injectable({
  providedIn: 'root'
})
export class ListService {
  private apiUrl = environment.Backend;
  private baseUrl = '/proyLista';

  constructor(private http: HttpClient, private authService: AuthService, private uniqueIdService: UniqueIdService) { }


  /**
   * Buscar listas filtradas por carpetaIdentificador
   */
  searchListsFiltered(carpetaIdentificador: string): Observable<any[]> {
    const headers = this.authService.createHeaders();
    const body: any = { carpetaIdentificador };
    return this.http.post<any>(`${this.apiUrl}${this.baseUrl}/buscarFiltrado`, body, { headers })
      .pipe(map((resp: any) => Array.isArray(resp) ? resp : (resp?.proyListaList ?? [])));
  }

  /**
   * Crear una nueva lista
   */
  createList(list: any): Observable<any> {
    const headers = this.authService.createHeaders();
    const currentUser = this.authService.getCurrentUser();
    const identificador = this.uniqueIdService.generateId(list?.nombre)
    const listData = {
      identificador: identificador,
      estado: list.estado ?? 'Activo',
      nombre: list.nombre,
      descripcion: list.descripcion,
      organizacionId: currentUser?.organizacionId,
      clienteId: currentUser?.clienteId,
      carpetaIdentificador: list.carpetaIdentificador,
      templateEstadoIdentificador: list.templateEstadoIdentificador,
      publico: list.publico,
    };
    return this.http.post<any>(`${this.apiUrl}${this.baseUrl}/crear`, listData, { headers });
  }


  /**
   * Actualizar una lista existente
   */
  updateList(list: any): Observable<any> {
    const headers = this.authService.createHeaders();
    const currentUser = this.authService.getCurrentUser();
    const listData = {
      identificador: list.identificador,
      estado: list.estado,
      nombre: list.nombre,
      descripcion: list.descripcion,
      organizacionId: list.organizacionId,
      clienteId: list.clienteId,
      carpetaIdentificador: list.carpetaIdentificador,
      publico: list.publico,
      templateEstadoIdentificador: list.templateEstadoIdentificador
      // usuarioActualizacion: username
    };
    return this.http.put<any>(`${this.apiUrl}${this.baseUrl}/actualizar`, listData, { headers });
  }

  deleteList(list: any): Observable<any> {
    const headers = this.authService.createHeaders();
    return this.http.delete<any>(`${this.apiUrl}${this.baseUrl}/eliminar`, { headers, body: list });
  }

  /**
   * Aplicar un template de tareas a una lista (el backend crea las tareas)
   */
  applyTemplateToList(listaIdentificador: string, templateIdentificador: string): Observable<string> {
    const headers = this.authService.createHeaders();
    const url = `${this.apiUrl}${this.baseUrl}/aplicarTemplate/${encodeURIComponent(listaIdentificador)}/${encodeURIComponent(templateIdentificador)}`;
    return this.http.post(url, {}, { headers, responseType: 'text' }) as Observable<string>;
  }
}
