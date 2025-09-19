import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TemplateTaskdetailService } from 'src/app/service/features/template/task/template-taskdetail.service';
import { AuthService } from 'src/app/service/core/auth/auth.service';

const PRIORITY_OPTIONS = [
	{ key: '', label: 'None', color: '#a0a0a0' },
	{ key: 'URGENT', label: 'Urgente', color: '#c70000' },
	{ key: 'HIGH', label: 'Alta', color: '#f7b500' },
	{ key: 'MEDIUM', label: 'Media', color: '#00a3ff' },
	{ key: 'LOW', label: 'Baja', color: '#24be00' },
];

@Component({
  selector: 'app-modal-template-task-details',
  templateUrl: './modal-template-task-details.component.html',
  styleUrls: ['./modal-template-task-details.component.scss']
})
export class ModalTemplateTaskDetailsComponent implements OnInit {
  @Input() templateId!: string;
  @Input() templateName?: string;

  loading = false;
  error?: string;
  details: any[] = [];

  priorityOptions = PRIORITY_OPTIONS;

  // add/edit state
  adding = false;
  newDetail: { nombre: string; etiqueta: string; prioridad: string; duracionHoras: number; descripcion: string; comentarios: string; } = { nombre: '', etiqueta: '', prioridad: 'MEDIUM', duracionHoras: 0, descripcion: '', comentarios: '' };
  editingId: string | null = null;
  editDetail: { nombre: string; etiqueta: string; prioridad: string; duracionHoras: number; descripcion: string; comentarios: string; } = { nombre: '', etiqueta: '', prioridad: 'MEDIUM', duracionHoras: 0, descripcion: '', comentarios: '' };

  constructor(
    public activeModal: NgbActiveModal,
    private detailsService: TemplateTaskdetailService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    if (!this.templateId) return;
    this.loading = true;
    this.error = undefined;
    this.detailsService.listTemplateTaskDetails(this.templateId).subscribe({
      next: (rows: any) => {
        this.details = Array.isArray(rows) ? rows : [];
      },
      error: (e: any) => {
        console.error('Error loading details', e);
        this.error = 'No se pudieron cargar las tareas';
      },
      complete: () => { this.loading = false; }
    });
  }

  close(): void { this.activeModal.dismiss(); }

  startAdd(): void {
    this.adding = true;
    this.newDetail = { nombre: '', etiqueta: '', prioridad: 'MEDIUM', duracionHoras: 0, descripcion: '', comentarios: '' };
  }
  cancelAdd(): void { this.adding = false; }

  saveNew(): void {
    const nombre = (this.newDetail.nombre || '').trim();
    if (!nombre) return;
    
    this.loading = true;
    const payload = {
      templateTareaIdentificador: this.templateId,
      ...this.newDetail,
      organizacionId: this.auth.getCurrentUser()?.organizacionId,
      clienteId: this.auth.getCurrentUser()?.clienteId,
    };

    this.detailsService.createTemplateTaskDetail(payload).subscribe({
      next: () => {
        this.adding = false;
        this.reload();
      },
      error: (e) => {
        console.error('Error creating detail', e);
        this.error = 'No se pudo crear el detalle.';
        this.loading = false;
      }
    });
  }

  startEdit(row: any): void {
    this.editingId = row?.identificador || null;
    this.editDetail = { 
      nombre: row?.nombre || '', 
      etiqueta: row?.etiqueta || '', 
      prioridad: row?.prioridad || 'MEDIUM',
      duracionHoras: row?.duracionHoras || 0,
      descripcion: row?.descripcion || '',
      comentarios: row?.comentarios || ''
    };
  }
  cancelEdit(): void { this.editingId = null; }

  saveEdit(): void {
    if (!this.editingId) return;
    const nombre = (this.editDetail.nombre || '').trim();
    if (!nombre) return;

    this.loading = true;
    const payload = {
      ...this.editDetail,
      organizacionId: this.auth.getCurrentUser()?.organizacionId,
      clienteId: this.auth.getCurrentUser()?.clienteId,
    };

    this.detailsService.editTemplateTaskDetail(this.editingId, payload).subscribe({
      next: () => {
        this.editingId = null;
        this.reload();
      },
      error: (e) => {
        console.error('Error updating detail', e);
        this.error = 'No se pudo actualizar el detalle.';
        this.loading = false;
      }
    });
  }

  delete(row: any): void {
    const id = row?.identificador;
    if (!id) return;
    if (!confirm(`¿Eliminar la tarea "${row?.nombre}"?`)) return;

    this.loading = true;
    this.detailsService.deleteTemplateTaskDetail(id).subscribe({
      next: () => {
        this.reload();
      },
      error: (e) => {
        console.error('Error deleting detail', e);
        this.error = 'No se pudo eliminar el detalle.';
        this.loading = false;
      }
    });
  }

  getPriorityLabelValue(value?: string): string {
    return this.priorityOptions.find(o => o.key === value)?.label || '';
  }

  getPriorityColorValue(value?: string): string {
    return this.priorityOptions.find(o => o.key === value)?.color || '';
  }
}
