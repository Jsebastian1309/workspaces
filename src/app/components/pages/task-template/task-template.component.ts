import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TemplateTaskService } from 'src/app/service/features/template/task/template-task.service';
import { WizardTaskComponent } from 'src/app/components/Wizard/wizard-task/wizard-task.component';
import { ModalTemplateTaskDetailsComponent } from '../../modals/modal-template-task-details/modal-template-task-details.component';

@Component({
  selector: 'app-task-template',
  templateUrl: './task-template.component.html',
  styleUrls: ['./task-template.component.scss']
})
export class TaskTemplateComponent {
  templates: any[] = [];
  selectedTemplate: any = null;
  loading = false;
  error = '';
  success = '';

  editingTemplate: any = null;
  editTemplate = { nombre: '', estado: '' };

  constructor(
    private templateTaskService: TemplateTaskService,
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

  openDetailsModal(template: any): void {
    const modalRef = this.modalService.open(ModalTemplateTaskDetailsComponent, { size: 'xl', backdrop: 'static' });
    modalRef.componentInstance.templateId = template.identificador;
    modalRef.componentInstance.templateName = template.nombre;
  }

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
    const payload = { nombre: this.editTemplate.nombre, estado: 'ACTIVE' };
    this.templateTaskService.editTemplateTask(template.identificador, payload).subscribe({
      next: () => {
        this.success = 'Template updated successfully';
        this.editingTemplate = null;
        this.loadTemplates();
        if (this.selectedTemplate?.identificador === template.identificador) {
          this.selectedTemplate.nombre = this.editTemplate.nombre;
        }
      },
      error: (err) => {
        this.error = 'Error updating template';
        this.loading = false;
      }
    });
  }

  deleteTemplate(template: any): void {
    if (!confirm(`Are you sure you want to delete "${template.nombre}"?`)) return;
    this.loading = true;
    this.templateTaskService.deleteTemplateTask(template.identificador).subscribe({
      next: () => {
        this.success = 'Template deleted successfully';
        this.loadTemplates();
        if (this.selectedTemplate?.identificador === template.identificador) {
          this.selectedTemplate = null;
        }
      },
      error: (err) => {
        this.error = 'Error deleting template';
        this.loading = false;
      }
    });
  }
}