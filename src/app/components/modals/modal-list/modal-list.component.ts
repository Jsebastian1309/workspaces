import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/service/core/auth/Auth.service';
import { ListService } from 'src/app/service/features/list/List.service';
import { TemplatesService, StatusTemplate } from 'src/app/service/features/templates/Templates.service';

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

  listForm: FormGroup;
  templates: StatusTemplate[] = [];
  templateTypes: string[] = [];
  selectedTemplateType: string = '';
  templatesFiltered: StatusTemplate[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private listService: ListService,
    private authService: AuthService,
    private templatesService: TemplatesService
  ) {
    this.listForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      publico: [true],
      estado: ['Activo'],
      templateId: [null, []]
    });
  }

  ngOnInit(): void {
    // Load available status templates and set a sensible default
    this.templatesService.getAll().subscribe(list => {
      this.templates = list || [];
      // Obtener los tipos únicos de template
      this.templateTypes = Array.from(new Set(this.templates.map(t => t.tipo || 'Otro')));
      this.selectedTemplateType = this.templateTypes[0] || '';
      this.filtrarTemplatesPorTipo();
      if (this.templatesFiltered.length > 0 && !this.listForm.get('templateId')?.value) {
        this.listForm.patchValue({ templateId: this.templatesFiltered[0].id });
      }
    });
  }

  filtrarTemplatesPorTipo() {
    this.templatesFiltered = this.templates.filter(t => (t.tipo || 'Otro') === this.selectedTemplateType);
    // Si el template seleccionado ya no está en la lista filtrada, lo reseteamos
    const actual = this.listForm.get('templateId')?.value;
    if (!this.templatesFiltered.find(t => t.id === actual)) {
      this.listForm.patchValue({ templateId: this.templatesFiltered[0]?.id || null });
    }
  }
  // Detectar cambio de tipo de template desde el select
  ngOnChanges() {
    this.filtrarTemplatesPorTipo();
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
        carpetaId: this.SelectedFolder.id || this.SelectedFolder.carpeta_id
      };

      this.listService.createList(payload).subscribe({
        next: (resp) => {
          const listIdent = resp?.identificador || identificador;
          const tmplId = raw.templateId;
          if (tmplId) {
            this.templatesService.setListTemplate(listIdent, tmplId);
          }
          this.activeModal.close(resp);
        },
        error: (err) => {
          console.error('Error creando la lista', err);
          // Aun en error, persistimos el mapeo localmente para continuidad offline
          const tmplId = raw.templateId;
          if (tmplId) {
            this.templatesService.setListTemplate(identificador, tmplId);
          }
          // Devuelve payload para que el caller pueda manejarlo
          this.activeModal.close(payload);
        }
      });
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

