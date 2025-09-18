import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { WizardTaskComponent } from '../../Wizard/wizard-task/wizard-task.component';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TemplateStatusService } from 'src/app/service/features/template/status/template-status.service';
import { TemplateStatusDetailService } from 'src/app/service/features/template/status/template-statusdetail.service';
import { AuthService } from 'src/app/service/core/auth/auth.service';
import { UniqueIdService } from 'src/app/service/core/utils/uniqueId.service';
import { WizardStatesComponent } from '../../Wizard/wizard-states/wizard-states.component';
import { ModalTemplateStatusDetailsComponent } from '../../modals/modal-template-status-details/modal-template-status-details.component';

@Component({
  selector: 'app-status-template',
  templateUrl: './status-template.component.html',
  styleUrls: ['./status-template.component.scss']
})
export class StatusTemplateComponent implements OnInit {
  form: FormGroup;
  saving = false;
  saveMessage: 'idle' | 'success' | 'error' = 'idle';
  showCreateForm = false;
  templates: any[] = [];
  templatesLoading = false;
  templatesError?: string;
  selectedTemplate: any | null = null;
  selectedDetails: any[] = [];
  detailsLoading = false;
  detailsError?: string;
  editingTemplate: string | null = null;
  editTemplate = { nombre: '' };

  // Inline add/edit state for details
  addingDetail = false;
  newDetail: { nombre: string; secuencia: number; color: string | null } = {
    nombre: '',
    secuencia: 1,
    color: '#0d6efd'
  };
  editingDetailId: string | null = null;
  editDetail: { nombre: string; secuencia: number; color: string | null } = {
    nombre: '',
    secuencia: 0,
    color: '#0d6efd'
  };

  constructor(
    private fb: FormBuilder,
    private templateStatusService: TemplateStatusService,
    private templateStatusDetailService: TemplateStatusDetailService,
    private authService: AuthService,
  private uniqueId: UniqueIdService,
  private modalService: NgbModal
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      detalles: this.fb.array([])
    });
  }

  ngOnInit(): void {
  if (this.detalles.length === 0) this.addDetalle();
  this.loadTemplates();
  }

  get detalles(): FormArray {
    return this.form.get('detalles') as FormArray;
  }

  detalleGroup(init?: { nombre?: string; secuencia?: number; color?: string | null }): FormGroup {
    return this.fb.group({
      nombre: [init?.nombre || '', [Validators.required, Validators.minLength(2)]],
      secuencia: [init?.secuencia ?? (this.detalles.length + 1), [Validators.required, Validators.min(0)]],
      color: [init?.color ?? '#0d6efd', [Validators.required]]
    });
  }

  addDetalle(): void {
    this.detalles.push(this.detalleGroup());
  }

  removeDetalle(index: number): void {
  if (this.detalles.length <= 1) return;
  this.detalles.removeAt(index);
  }

  submit(): void {
    this.saveMessage = 'idle';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;

    const nombre = (this.form.value?.nombre || '').trim();
  this.templateStatusService.createTemplateStatus({ nombre }).subscribe({
      next: (created) => {
        const templateEstadoIdentificador = created?.identificador || created?.id || created?._id;
        if (!templateEstadoIdentificador) {
          console.warn('No identificador found on create response', created);
          this.saving = false;
          this.saveMessage = 'error';
          return;
        }

        const currentUser = this.authService.getCurrentUser();
        const requests = this.detalles.controls.map(ctrl => {
          const v = ctrl.value as { nombre: string; secuencia: number; color: string };
          const payload = {
            organizacionId: currentUser?.organizacionId,
            clienteId: currentUser?.clienteId,
            templateEstadoIdentificador,
            identificador: this.uniqueId.generateId(v.nombre),
            secuencia: Number(v.secuencia) || 0,
            nombre: v.nombre,
            color: v.color
          };
          return this.templateStatusDetailService.createTemplateStatusDetail(payload);
        });

        if (requests.length === 0) {
          this.onSaveSuccess();
          return;
        }

        forkJoin(requests).subscribe({
          next: () => this.onSaveSuccess(templateEstadoIdentificador),
          error: () => this.onSaveError()
        });
      },
      error: () => this.onSaveError()
    });
  }


  toggleCreateForm(): void {
    const ref = this.modalService.open(WizardStatesComponent, { size: 'lg', backdrop: 'static', keyboard: false });
    ref.result
      .then((res) => {
        if (res === 'completed') {
          this.loadTemplates();
        }
      })
      .catch(() => {});
  }

  openDetailsModal(tpl: any): void {
    if (!tpl) return;
    const ident = tpl.identificador || tpl.id || tpl._id;
    const modalRef = this.modalService.open(ModalTemplateStatusDetailsComponent, { size: 'lg', backdrop: 'static', keyboard: false });
    (modalRef.componentInstance as ModalTemplateStatusDetailsComponent).templateId = ident;
    (modalRef.componentInstance as ModalTemplateStatusDetailsComponent).templateName = tpl.nombre;
    modalRef.result
      .then((res) => {
        if (res === 'updated' || res === 'deleted' || res === 'created') {
          this.loadTemplates();
        }
      })
      .catch(() => {});
  }

  createTemplate(): void {
    // Kept for backward compatibility; now handled by wizard
    this.submit();
  }

  // Wizard event handlers
  onWizardCompleted(): void {
  // Not used in modal mode, kept for compatibility
  this.loadTemplates();
  }

  onWizardCancelled(): void {
  // Not used in modal mode, kept for compatibility
  }

  private onSaveSuccess(selectIdent?: string): void {
    this.saving = false;
    this.saveMessage = 'success';
    // reset form and leave one empty row
    this.form.reset();
    this.detalles.clear();
    this.addDetalle();
    // refresh templates list and optionally select the created one
    this.loadTemplates(() => {
      if (selectIdent) {
        const t = this.templates.find(x => x.identificador === selectIdent);
        if (t) this.selectTemplate(t);
      }
    });
  }

  private onSaveError(): void {
    this.saving = false;
    this.saveMessage = 'error';
  }

  // Load existing templates
  loadTemplates(after?: () => void) {
    this.templatesLoading = true;
    this.templatesError = undefined;
    this.templateStatusService.listTemplateStatus().subscribe({
      next: (list) => {
        this.templates = Array.isArray(list) ? list : [];
      },
      error: (e) => {
        console.error('Error loading templates', e);
        this.templatesError = 'No se pudieron cargar los templates';
      },
      complete: () => {
        this.templatesLoading = false;
        if (after) after();
      }
    });
  }

  selectTemplate(tpl: any) {
    if (!tpl) { this.selectedTemplate = null; this.selectedDetails = []; return; }
    this.selectedTemplate = tpl;
    const ident = tpl.identificador || tpl.id || tpl._id;
    if (!ident) { this.selectedDetails = []; return; }
    this.detailsLoading = true;
    this.detailsError = undefined;
    this.templateStatusDetailService.listTemplateStatusDetails(ident).subscribe({
      next: (rows) => {
        const arr = Array.isArray(rows) ? rows : [];
        this.selectedDetails = arr.sort((a, b) => (a.secuencia ?? 0) - (b.secuencia ?? 0));
      },
      error: (e) => {
        console.error('Error loading details', e);
        this.detailsError = 'No se pudieron cargar los estados';
      },
      complete: () => { this.detailsLoading = false; }
    });
  }

  startEdit(tpl: any): void {
    this.editingTemplate = tpl?.identificador || null;
    this.editTemplate = { nombre: tpl?.nombre || '' };
  }
  // Details toolbar actions
  startAddDetail(): void {
    this.addingDetail = true;
    const nextSeq = (this.selectedDetails?.length || 0) + 1;
    this.newDetail = { nombre: '', secuencia: nextSeq, color: '#0d6efd' };
  }

  cancelAddDetail(): void {
    this.addingDetail = false;
    this.newDetail = { nombre: '', secuencia: 1, color: '#0d6efd' };
  }

  saveNewDetail(): void {
    if (!this.selectedTemplate) return;
    const nombre = (this.newDetail.nombre || '').trim();
    const secuencia = Number(this.newDetail.secuencia) || 0;
    const color = this.newDetail.color;
    if (!nombre || !color) return;

    const templateEstadoIdentificador = this.selectedTemplate.identificador || this.selectedTemplate.id || this.selectedTemplate._id;
    if (!templateEstadoIdentificador) return;

    const currentUser = this.authService.getCurrentUser();
    const payload = {
      organizacionId: currentUser?.organizacionId,
      clienteId: currentUser?.clienteId,
      templateEstadoIdentificador,
      identificador: this.uniqueId.generateId(nombre),
      secuencia,
      nombre,
      color
    };

    this.detailsLoading = true;
    this.templateStatusDetailService.createTemplateStatusDetail(payload).subscribe({
      next: () => {
        this.addingDetail = false;
        this.newDetail = { nombre: '', secuencia: 1, color: '#0d6efd' };
        this.selectTemplate(this.selectedTemplate);
      },
      error: (e) => {
        console.error('Error creating detail', e);
        this.detailsError = 'No se pudo crear el estado';
        this.detailsLoading = false;
      }
    });
  }

  startEditDetail(detail: any): void {
    this.editingDetailId = detail?.identificador || null;
    this.editDetail = {
      nombre: detail?.nombre || '',
      secuencia: Number(detail?.secuencia) || 0,
      color: detail?.color || '#0d6efd'
    };
  }

  cancelEditDetail(): void {
    this.editingDetailId = null;
    this.editDetail = { nombre: '', secuencia: 0, color: '#0d6efd' };
  }

  saveEditDetail(detail: any): void {
    if (!this.editingDetailId) return;
    const id = this.editingDetailId;
    const nombre = (this.editDetail.nombre || '').trim();
    const color = this.editDetail.color;
    const secuencia = Number(this.editDetail.secuencia) || 0;
    if (!nombre || !color) return;

    this.detailsLoading = true;
    this.templateStatusDetailService.editTemplateStatusDetail(id, { nombre, color, secuencia }).subscribe({
      next: () => {
        this.editingDetailId = null;
        this.selectTemplate(this.selectedTemplate);
      },
      error: (e) => {
        console.error('Error updating detail', e);
        this.detailsError = 'No se pudo actualizar el estado';
        this.detailsLoading = false;
      }
    });
  }

  deleteDetail(detail: any): void {
    const id = detail?.identificador;
    if (!id) return;
    if (!confirm(`¿Eliminar el estado "${detail?.nombre}"?`)) return;
    this.detailsLoading = true;
    this.templateStatusDetailService.deleteTemplateStatusDetail(id).subscribe({
      next: () => this.selectTemplate(this.selectedTemplate),
      error: (e) => {
        console.error('Error eliminando estado', e);
        this.detailsError = 'No se pudo eliminar el estado';
        this.detailsLoading = false;
      }
    });
  }

  cancelEdit(): void {
    this.editingTemplate = null;
    this.editTemplate = { nombre: '' };
  }

  saveEdit(tpl: any): void {
    if (!this.editingTemplate) return;
    const id = this.editingTemplate;
    const nombre = (this.editTemplate.nombre).trim();
    if (!nombre) return;
    this.templatesLoading = true;
    this.templateStatusService.editTemplateStatus(id, { nombre }).subscribe({
      next: () => {
        this.editingTemplate = null;
        this.loadTemplates(() => {
          if (this.selectedTemplate?.identificador === id) {
            this.selectedTemplate.nombre = nombre;
          }
        });
      },
      error: () => {
        this.templatesError = 'No se pudo actualizar el template';
        this.templatesLoading = false;
      }
    });
  }

  deleteTemplate(tpl: any): void {
    const id = tpl?.identificador;
    if (!id) return;
    if (!confirm(`¿Eliminar el template "${tpl?.nombre}"?`)) return;
    this.templatesLoading = true;
    this.templateStatusService.deleteTemplateStatus(id).subscribe({
      next: () => {
        if (this.selectedTemplate?.identificador === id) {
          this.selectedTemplate = null;
          this.selectedDetails = [];
        }
        this.loadTemplates();
      },
      error: () => {
        this.templatesError = 'No se pudo eliminar el template';
        this.templatesLoading = false;
      }
    });
  }

  onSelectTemplateId(id: string | number) {
  const t = this.templates?.find(x => x.identificador === id);
  if (t) this.selectTemplate(t);
}
}
