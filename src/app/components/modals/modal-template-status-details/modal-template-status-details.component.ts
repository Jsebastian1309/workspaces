import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TemplateStatusDetailService } from 'src/app/service/features/template/status/template-statusdetail.service';
import { AuthService } from 'src/app/service/core/auth/auth.service';
import { UniqueIdService } from 'src/app/service/core/utils/uniqueId.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-modal-template-status-details',
  templateUrl: './modal-template-status-details.component.html',
  styleUrls: ['./modal-template-status-details.component.scss']
})
export class ModalTemplateStatusDetailsComponent implements OnInit {
  @Input() templateId!: string;
  @Input() templateName?: string;

  loading = false;
  error?: string;
  details: any[] = [];

  // Track original data to compute diffs on Save
  private originalSnapshot: Record<string, { nombre: string; color: string; secuencia: number }> = {};
  // Deferred changes
  private pendingCreates: any[] = [];
  private pendingDeletes: Set<string> = new Set();

  // add/edit state
  adding = false;
  newDetail: { nombre: string; color: string } = { nombre: '', color: '#0d6efd' };
  editingId: string | null = null;
  editDetail: { nombre: string; color: string } = { nombre: '', color: '#0d6efd' };

  constructor(
    public activeModal: NgbActiveModal,
    private detailsService: TemplateStatusDetailService,
    private auth: AuthService,
    private uniqueId: UniqueIdService,
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    if (!this.templateId) return;
    this.loading = true;
    this.error = undefined;
    this.detailsService.listTemplateStatusDetails(this.templateId).subscribe({
      next: (rows: any) => {
        const arr = Array.isArray(rows) ? rows : [];
        this.details = arr
          .slice()
          .sort((a, b) => (a.secuencia ?? 0) - (b.secuencia ?? 0))
          .map((d: any, idx: number) => ({ ...d, secuencia: idx + 1 }));
        // Reset change tracking on fresh load
        this.originalSnapshot = Object.fromEntries(this.details.map(d => [d.identificador, {
          nombre: d.nombre,
          color: d.color,
          secuencia: d.secuencia
        }]));
        this.pendingCreates = [];
        this.pendingDeletes.clear();
      },
      error: (e: any) => {
        console.error('Error loading details', e);
        this.error = 'No se pudieron cargar los estados';
      },
      complete: () => { this.loading = false; }
    });
  }

  close(): void { this.activeModal.dismiss(); }

  startAdd(): void {
    this.adding = true;
    this.newDetail = { nombre: '', color: '#0d6efd' };
  }
  cancelAdd(): void { this.adding = false; }

  saveNew(): void {
    const nombre = (this.newDetail.nombre || '').trim();
    if (!nombre) return;
    // Create local item and defer persistence
    const newId = this.uniqueId.generateId(nombre);
    const newItem = {
      identificador: newId,
      nombre,
      color: this.newDetail.color,
      secuencia: (this.details?.length || 0) + 1
    };
    this.details.push(newItem);
    this.pendingCreates.push(newItem);
    this.adding = false;
  }

  startEdit(row: any): void {
    this.editingId = row?.identificador || null;
    this.editDetail = { nombre: row?.nombre || '', color: row?.color || '#0d6efd' };
  }
  cancelEdit(): void { this.editingId = null; }

  saveEdit(): void {
    if (!this.editingId) return;
    const nombre = (this.editDetail.nombre || '').trim();
    if (!nombre) return;
    // Apply locally and defer persistence
    const idx = this.details.findIndex(d => d.identificador === this.editingId);
    if (idx >= 0) {
      this.details[idx] = { ...this.details[idx], nombre, color: this.editDetail.color };
    }
    this.editingId = null;
  }

  delete(row: any): void {
    const id = row?.identificador;
    if (!id) return;
    if (!confirm(`¿Eliminar el estado "${row?.nombre}"?`)) return;
    // If it's a newly added (not yet persisted), remove from pendingCreates
    const createdIdx = this.pendingCreates.findIndex((c: any) => c.identificador === id);
    if (createdIdx >= 0) {
      this.pendingCreates.splice(createdIdx, 1);
    } else {
      this.pendingDeletes.add(id);
    }
    // Remove from current list and reindex sequences
    this.details = this.details.filter(d => d.identificador !== id);
    this.details.forEach((d, idx) => d.secuencia = idx + 1);
  }

  // Drag & Drop reorder
  drop(event: CdkDragDrop<any[]>): void {
    moveItemInArray(this.details, event.previousIndex, event.currentIndex);
    // reindex 1..n locally
    this.details.forEach((d, idx) => d.secuencia = idx + 1);
  }

  // Persist all pending changes
  saveAll(): void {
    if (!this.templateId) { this.activeModal.close(false); return; }
    this.loading = true;

    // Build delete requests
    const delReqs = Array.from(this.pendingDeletes).map(id => this.detailsService.deleteTemplateStatusDetail(id));

    // Build create requests with final sequences
    const creates = this.pendingCreates.map(item => {
      const idx = this.details.findIndex(d => d.identificador === item.identificador);
      const secuencia = idx >= 0 ? (idx + 1) : item.secuencia;
      return this.detailsService.createTemplateStatusDetail({
        organizacionId: this.auth.getCurrentUser()?.organizacionId,
        clienteId: this.auth.getCurrentUser()?.clienteId,
        templateEstadoIdentificador: this.templateId,
        identificador: item.identificador,
        nombre: item.nombre,
        color: item.color,
        secuencia
      });
    });

    // Build update requests for existing items that changed (and not deleted)
    const updates = this.details
      .filter(d => this.originalSnapshot[d.identificador] && !this.pendingDeletes.has(d.identificador))
      .map(d => {
        const orig = this.originalSnapshot[d.identificador];
        const changed = !orig ||
          (orig.nombre !== d.nombre) ||
          (orig.color !== d.color) ||
          (orig.secuencia !== d.secuencia);
        if (!changed) return null;
        const payload = {
          organizacionId: this.auth.getCurrentUser()?.organizacionId,
          clienteId: this.auth.getCurrentUser()?.clienteId,
          templateEstadoIdentificador: this.templateId,
          identificador: d.identificador,
          secuencia: d.secuencia,
          nombre: d.nombre,
          color: d.color
        };
        return this.detailsService.editTemplateStatusDetail(d.identificador, payload);
      })
      .filter((req): req is ReturnType<typeof this.detailsService.editTemplateStatusDetail> => !!req);

    const allReqs = [...delReqs, ...creates, ...updates];
    if (allReqs.length === 0) {
      this.loading = false;
      this.activeModal.close(false);
      return;
    }

    forkJoin(allReqs).subscribe({
      next: () => {
        this.activeModal.close(true);
      },
      error: (e: any) => {
        console.error('Error guardando cambios', e);
        this.error = 'No se pudieron guardar los cambios';
      },
      complete: () => { this.loading = false; }
    });
  }
}
