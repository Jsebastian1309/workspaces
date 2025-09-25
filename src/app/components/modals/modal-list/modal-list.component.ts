import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/service/core/auth/auth.service';
import { ListService } from 'src/app/service/features/list/list.service';
import { TemplateStatusService } from 'src/app/service/features/template/status/template-status.service';
import { TemplateStatusDetailService } from 'src/app/service/features/template/status/template-statusdetail.service';

@Component({
  selector: 'app-modal-list',
  templateUrl: './modal-list.component.html',
  styleUrls: ['./modal-list.component.scss']
})
export class ModalListComponent implements OnInit {
  @Input() title: string = 'Create New List';
  @Input() SelectedWorkspace: any;
  @Input() SelectedSpace: any;
  @Input() SelectedFolder: any;
  @Input() isEditMode: boolean = false;
  @Input() SelectedList: any;

  listForm: FormGroup;
  templates: any[] = [];
  selectedTemplateStates: any[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private listService: ListService,
    private authService: AuthService,
    private templateStatusService: TemplateStatusService,
    private templateStatusDetailService: TemplateStatusDetailService
  ) {
    this.listForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      publico: [true],
      estado: ['Activo'],
      templateEstadoIdentificador: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.templateStatusService.listTemplateStatus().subscribe({
      next: (list) => {
        console.log('Templates cargados:', list);
        this.templates = Array.isArray(list) ? list : [];
      },
      error: (e) => console.error('Error cargando templates de estado', e)
    });

    if (this.isEditMode && this.SelectedList) {
      this.title = this.title || 'Edit List';
      const l = this.SelectedList;
      this.listForm.patchValue({
        nombre: l.nombre || '',
        descripcion: l.descripcion || '',
        publico: typeof l.publico === 'boolean' ? l.publico : true,
        estado: l.estado || 'Activo',
        templateEstadoIdentificador: l.templateEstadoIdentificador || null
      });

      if (l.templateEstadoIdentificador) {
        this.loadTemplateStates(l.templateEstadoIdentificador);
      }
    }
  }

  onTemplateSelected(templateId: string): void {
    console.log('Valor crudo recibido:', templateId);
    console.log('Tipo del valor:', typeof templateId);
    
    // Si el valor contiene ":" significa que viene con formato "id: identificador"
    let cleanTemplateId = templateId;
    if (templateId && templateId.includes(':')) {
      // Extraer solo la parte después de los dos puntos y el espacio
      cleanTemplateId = templateId.split(': ')[1] || templateId;
      console.log('Valor limpio extraído:', cleanTemplateId);
    }
    
    if (cleanTemplateId && cleanTemplateId !== 'null') {
      this.loadTemplateStates(cleanTemplateId);
    } else {
      this.selectedTemplateStates = [];
    }
  }

  private loadTemplateStates(templateId: string): void {
    console.log('Cargando estados para template:', templateId);
    this.templateStatusDetailService.listTemplateStatusDetails(templateId).subscribe({
      next: (rows) => {
        console.log('Respuesta cruda del backend:', rows);
        const arr = Array.isArray(rows) ? rows : [];
        this.selectedTemplateStates = arr.sort((a, b) => (a.secuencia ?? 0) - (b.secuencia ?? 0));
        console.log('Estados procesados y ordenados:', this.selectedTemplateStates);
      },
      error: (e) => {
        console.error('Error cargando estados del template', e);
        this.selectedTemplateStates = [];
      }
    });
  }

  private generateListId(nombre: string): string {
    const timestamp = Date.now();
    const nombreLimpio = (nombre || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    return `ls_${nombreLimpio}_${timestamp}`;
  }

  onSubmit() {
  if (this.listForm.valid && this.SelectedFolder) {
      const currentUser = this.authService.getCurrentUser();
      const raw = this.listForm.value;

      const nombreLimpio = (raw.nombre || '').trim();
      if (this.isEditMode && this.SelectedList) {
        const payload = {
          identificador: this.SelectedList.identificador,
          nombre: nombreLimpio,
          descripcion: raw.descripcion,
          publico: !!raw.publico,
          estado: raw.estado,
          organizacionId: this.SelectedList.organizacionId || currentUser?.organizacionId,
          clienteId: this.SelectedList.clienteId || currentUser?.clienteId,
          carpetaIdentificador: this.SelectedFolder.identificador || this.SelectedFolder.carpeta_identificador,
          carpetaId: this.SelectedFolder.id || this.SelectedFolder.carpeta_id,
          templateEstadoIdentificador: raw.templateEstadoIdentificador
        };

        this.listService.updateList(payload).subscribe({
          next: (resp) => {
            this.activeModal.close(resp || payload);
          },
          error: (err) => {
            console.error('Error actualizando la lista', err);
            this.activeModal.close(payload);
          }
        });
      } else {
        const identificador = this.generateListId(nombreLimpio);
        const payload = {
          identificador,
          nombre: nombreLimpio,
          descripcion: raw.descripcion,
          publico: !!raw.publico,
          estado: raw.estado,
          organizacionId: currentUser?.organizacionId,
          clienteId: currentUser?.clienteId,
          carpetaIdentificador: this.SelectedFolder.identificador || this.SelectedFolder.carpeta_identificador,
          carpetaId: this.SelectedFolder.id || this.SelectedFolder.carpeta_id,
          templateEstadoIdentificador: raw.templateEstadoIdentificador
        };

        this.listService.createList(payload).subscribe({
          next: (resp) => {
            this.activeModal.close(resp);
          },
          error: (err) => {
            console.error('Error creando la lista', err);
            // Devuelve payload para que el caller pueda manejarlo
            this.activeModal.close(payload);
          }
        });
      }
    } else {
      Object.keys(this.listForm.controls).forEach(k => this.listForm.get(k)?.markAsTouched());
    }
  }

  onCancel() { this.activeModal.dismiss(); }

  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.listForm.get(fieldName);
    if (errorType) {
      return field ? field.hasError(errorType) && field.touched : false;
    }
    return field ? field.invalid && field.touched : false;
  }
}

