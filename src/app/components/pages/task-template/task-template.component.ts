import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TemplateTaskService } from 'src/app/service/features/template/task/template-task.service';
import { TemplateTaskdetailService } from 'src/app/service/features/template/task/template-taskdetail.service';
import { WizardTaskComponent } from 'src/app/components/Wizard/wizard-task/wizard-task.component';
@Component({
  selector: 'app-task-template',
  templateUrl: './task-template.component.html',
  styleUrls: ['./task-template.component.scss']
})
export class TaskTemplateComponent {
  templates: any[] = [];
  selectedTemplate: any = null;
  templateDetails: any[] = [];
  loading = false;
  error = '';
  success = '';

  // For create/edit form
  showCreateForm = false;
  editingTemplate: any = null;
  newTemplate = { nombre: '', estado: 'ACTIVE' };
  editTemplate = { nombre: '', estado: '' };

  constructor(
    private templateTaskService: TemplateTaskService,
    private templateTaskdetailService: TemplateTaskdetailService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.loading = true;
    this.templateTaskService.listTemplateTasks().subscribe({
      next: (data) => {
        this.templates = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error loading templates';
        this.loading = false;
      }
    });
  }

  selectTemplate(template: any): void {
    this.selectedTemplate = template;
    this.loadTemplateDetails(template.identificador);
  }

  loadTemplateDetails(templateId: string): void {
    this.loading = true;
    this.templateTaskdetailService.listTemplateTaskDetails(templateId).subscribe({
      next: (data) => {
        this.templateDetails = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error loading template details';
        this.loading = false;
      }
    });
  }

  // Create methods now handled via Wizard modal
  toggleCreateForm(): void {
    const ref = this.modalService.open(WizardTaskComponent, { size: 'lg', backdrop: 'static', keyboard: false });
    ref.result
      .then((res) => {
        if (res?.action === 'completed') {
          this.loadTemplates();
        }
      })
      .catch(() => {});
  }

  // Edit methods
  startEdit(template: any): void {
    this.editingTemplate = template.identificador;
    this.editTemplate = { nombre: template.nombre, estado: template.estado };
  }

  cancelEdit(): void {
    this.editingTemplate = null;
    this.editTemplate = { nombre: '', estado: '' };
  }

  saveEdit(template: any): void {
    if (!this.editTemplate.nombre.trim()) return;
    this.loading = true;
    this.templateTaskService.editTemplateTask(template.identificador, this.editTemplate).subscribe({
      next: () => {
        this.success = 'Template updated successfully';
        this.editingTemplate = null;
        this.loadTemplates();
        if (this.selectedTemplate?.identificador === template.identificador) {
          this.selectedTemplate.nombre = this.editTemplate.nombre;
          this.selectedTemplate.estado = this.editTemplate.estado;
        }
      },
      error: (err) => {
        this.error = 'Error updating template';
        this.loading = false;
      }
    });
  }

  // Delete method
  deleteTemplate(template: any): void {
    if (!confirm(`Are you sure you want to delete "${template.nombre}"?`)) return;
    this.loading = true;
    this.templateTaskService.deleteTemplateTask(template.identificador).subscribe({
      next: () => {
        this.success = 'Template deleted successfully';
        this.loadTemplates();
        if (this.selectedTemplate?.identificador === template.identificador) {
          this.selectedTemplate = null;
          this.templateDetails = [];
        }
      },
      error: (err) => {
        this.error = 'Error deleting template';
        this.loading = false;
      }
    });
  }
}