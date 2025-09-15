import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs/operators';
import { ListService } from 'src/app/service/features/list/list.service';
import { TemplateTaskService } from 'src/app/service/features/template/task/template-task.service';
import { TemplateTaskdetailService } from 'src/app/service/features/template/task/template-taskdetail.service';

@Component({
  selector: 'app-modal-template-task',
  templateUrl: './modal-template-task.component.html',
  styleUrls: ['./modal-template-task.component.scss']
})
export class ModalTemplateTaskComponent {
  @Input() list?: any;
  @Input() templates: any[] = [];
  @Input() grouped: Record<string, any[]> = {};

  // Tabs: 'apply' or 'save'
  mode: 'apply' | 'save' = 'apply';
  loading = false;
  error?: string;
  info?: string;
  loadingTemplates = false;

  // apply
  selectedTemplateId: string | null = null;
  selectedTemplateMeta: any = null;
  templatePreview: any[] = [];
  applyOptions = { keepExistingTasks: true, overwriteStatus: false };

  // save
  newTemplate = { nombre: '', descripcion: '' };
  newTemplateOptions = { includeAssignments: false, includeDates: false };
  currentTasksFlat: any[] = [];
  selectedForTemplate: Record<string, boolean> = {};

  constructor(
    public activeModal: NgbActiveModal,
    private listService: ListService,
    private templateTaskService: TemplateTaskService,
    private templateTaskdetailService: TemplateTaskdetailService,
  ) {}

  ngOnInit() {
    this.buildCurrentTasksFlat();
    if (this.mode === 'apply' && (!this.templates || this.templates.length === 0)) {
      this.loadTemplates();
    }
  }

  // Common helpers
  getStatusLabel(key?: string): string { return key || ''; }

  private loadTemplates() {
    this.loadingTemplates = true;
    this.templateTaskService.listTemplateTasks().pipe(finalize(() => this.loadingTemplates = false)).subscribe({
      next: (data) => { this.templates = Array.isArray(data) ? data : []; },
      error: () => { this.error = 'Failed to load templates'; }
    });
  }

  // Apply flow
  onPickTemplate(id: string | null) {
    this.selectedTemplateMeta = (this.templates || []).find(t => t.identificador === id) || null;
    this.templatePreview = [];
    if (!id) return;
    this.templateTaskdetailService.listTemplateTaskDetails(id).subscribe({
      next: (rows) => {
        this.templatePreview = Array.isArray(rows) ? rows : [];
      },
      error: () => { this.error = 'Failed to load template preview'; }
    });
  }

  confirmApply() {
    if (!this.selectedTemplateId || !this.list?.identificador) return;
    this.loading = true;
    this.listService.applyTemplateToList(this.list.identificador, this.selectedTemplateId)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (msg: string) => {
          this.info = msg || 'Template applied';
          this.activeModal.close({ action: 'applied' });
        },
        error: () => { this.error = 'Could not apply template'; }
      });
  }

  // Save flow
  toggleSelectAllCurrent(value: boolean) {
    for (const t of this.currentTasksFlat) {
      if (t?.identificador) this.selectedForTemplate[t.identificador] = value;
    }
  }
  selectedCount(): number {
    return Object.values(this.selectedForTemplate || {}).filter(Boolean).length;
  }
  confirmSave() {
    const picked = (this.currentTasksFlat || []).filter(t => this.selectedForTemplate?.[t.identificador]);
    if (!this.newTemplate?.nombre || picked.length === 0) return;
    this.loading = true;
    this.templateTaskService.createTemplateTask({ nombre: this.newTemplate.nombre, estado: 'ACTIVE' })
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (created) => {
          const templateId = created?.identificador || created?.id || created?._id;
          if (templateId) {
            picked.forEach((t: any) => {
              const payload: any = {
                templateTareaIdentificador: templateId,
                nombre: t.nombre,
                descripcion: t.descripcion,
                estado: t.estado,
                prioridad: t.prioridad,
                fechaVencimiento: this.newTemplateOptions.includeDates ? t.fechaVencimiento : undefined,
                asignadoA: this.newTemplateOptions.includeAssignments ? (t.asignadoA || t.responsableIdentificador) : undefined,
              };
              this.templateTaskdetailService.createTemplateTaskDetail(payload).subscribe();
            });
          }
          this.activeModal.close({ action: 'saved', templateId });
        },
        error: () => { this.error = 'Could not create template'; }
      });
  }

  private buildCurrentTasksFlat() {
    const all: any[] = [];
    const entries = Object.entries(this.grouped || {});
    for (const [, arr] of entries) {
      for (const t of (arr || [])) all.push(t);
    }
    this.currentTasksFlat = all;
    this.selectedForTemplate = {};
    for (const t of this.currentTasksFlat) {
      if (t?.identificador) this.selectedForTemplate[t.identificador] = true;
    }
  }

}
