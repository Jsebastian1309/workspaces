import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AuthService } from './AuthService.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FolderService {

   private apiUrl = environment.Backend;
      private baseUrl = '/proyCarpeta';
  
      constructor(private http: HttpClient, private authService: AuthService) { }
  

  
    listFolders(): Observable<any[]> {
          const headers = this.authService.createHeaders();
          return this.http.get<any[]>(`${this.apiUrl}${this.baseUrl}/listar`,{ headers });
      }
  
    listFoldersByWorkspace(espacioTrabajoIdentificador: string): Observable<any[]> {
          const headers = this.authService.createHeaders();
          return this.http.get<any[]>(`${this.apiUrl}${this.baseUrl}/listar?espacioTrabajoIdentificador=${espacioTrabajoIdentificador}`, { headers });
      }
  
  
    searchFoldersFiltered(espacioTrabajoIdentificador: string, espacioIdentificador?: string): Observable<any[]> {
          const headers = this.authService.createHeaders();
          const body: any = {
          paginador: 'Y', offset: 0, limit: 100, campoOrder: '', direccionOrder: '', estado: 'Activo',
          espacioTrabajoIdentificador,
          espacioIdentificador: espacioIdentificador || '' ,
          publico: true
          };
          return this.http.post<any[]>(`${this.apiUrl}${this.baseUrl}/buscarFiltrado`, body, { headers });
      }
  
      /**
       * Buscar un espacio de trabajo por identificador
       */
    searchFolder(identificador: string): Observable<any> {
          const headers = this.authService.createHeaders();
          return this.http.get<any>(`${this.apiUrl}${this.baseUrl}/buscar/${identificador}`, { headers });
      }
  
      /**
       * Crear un nuevo espacio de trabajo
       */
      createFolder(payload: any): Observable<any> {
          const headers = this.authService.createHeaders();
          
          // Obtener información del usuario logueado
          const currentUser = this.authService.getCurrentUser();
          
          // Generar un identificador único cuando no venga
          const identificador = payload.identificador || this.generateIdFromName(payload.nombre);
          
          // Preparar el objeto con la información del usuario y organizacion
          // Mapear los nombres de los campos al formato que espera el backend
          const workspaceData = {
              identificador: identificador,
              nombre: payload.nombre,
              organizacionId: currentUser?.organizacion_id,
              clienteId: currentUser?.cliente_id,
              descripcion: payload.descripcion,
              publico: payload.publico,
              estado: payload.estado,
              usuario_creacion: currentUser?.username,
              espacioId: "10",
              espacioIdentificador: payload.espacioIdentificador
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
      private generateIdFromName(nombre: string): string {
          const timestamp = Date.now();
          const nombreLimpio = nombre.toLowerCase()
              .replace(/[^a-z0-9]/g, '_')
              .replace(/_+/g, '_')
              .replace(/^_|_$/g, '');
          return `fd_${nombreLimpio}_${timestamp}`;
      }
  }