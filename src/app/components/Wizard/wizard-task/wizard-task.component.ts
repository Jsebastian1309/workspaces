import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { AuthService } from 'src/app/service/core/auth/auth.service';
import { TemplateTaskService } from 'src/app/service/features/template/task/template-task.service';
import { TemplateTaskdetailService } from 'src/app/service/features/template/task/template-taskdetail.service';

@Component({
  selector: 'app-wizard-task',
  templateUrl: './wizard-task.component.html',
  styleUrls: ['./wizard-task.component.scss']
})
export class WizardTaskComponent {
  step: 1 | 2 = 1;
  saving = false;
  error?: string;

  form: FormGroup;

  get detalles(): FormArray {
    return this.form.get('detalles') as FormArray;
  }

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private auth: AuthService,
    private templateTaskService: TemplateTaskService,
    private templateTaskDetailService: TemplateTaskdetailService,
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      estado: ['ACTIVE', [Validators.required]],
      detalles: this.fb.array([])
    });
    // Start with one empty row for convenience
    this.addDetalle();
  }

  detalleGroup(init?: any): FormGroup {
    return this.fb.group({
      nombre: [init?.nombre || '', [Validators.required, Validators.minLength(2)]],
      etiqueta: [init?.etiqueta || ''],
      prioridad: [init?.prioridad || 'MEDIUM'],
      estado: [init?.estado || 'OPEN'],
      duracionHoras: [init?.duracionHoras ?? 0, [Validators.min(0)]],
      descripcion: [init?.descripcion || '']
    });
  }

  addDetalle(): void {
    this.detalles.push(this.detalleGroup());
  }

  removeDetalle(index: number): void {
    if (this.detalles.length <= 1) return;
    this.detalles.removeAt(index);
  }

  next(): void {
    if (this.step === 1) {
      if (this.form.get('nombre')?.invalid) {
        this.form.get('nombre')?.markAsTouched();
        return;
      }
      this.step = 2;
    }
  }

  back(): void {
    if (this.step === 2) this.step = 1;
  }

  close(): void {
    if (this.saving) return;
    this.activeModal.dismiss('cancelled');
  }

  finish(): void {
    if (this.saving) return;
    const nombre = (this.form.value?.nombre || '').trim();
    const estado = this.form.value?.estado || 'ACTIVE';
    if (!nombre) {
      this.error = 'Ingrese el nombre del template';
      return;
    }
    this.error = undefined;
    this.saving = true;

    this.templateTaskService.createTemplateTask({ nombre, estado })
      .pipe(
        catchError(() => {
          this.error = 'No se pudo crear el template';
          return of(null);
        })
      )
      .subscribe((created) => {
        const templateId = created?.identificador || created?.id || created?._id;
        if (!templateId) {
          this.saving = false;
          if (!this.error) this.error = 'Respuesta inválida del servidor';
          return;
        }

        const values = (this.form.value?.detalles || []) as any[];
        const payloads = values
          .map(v => ({
            templateTareaIdentificador: templateId,
            nombre: (v?.nombre || '').trim(),
            etiqueta: v?.etiqueta || undefined,
            prioridad: v?.prioridad || undefined,
            estado: v?.estado || undefined,
            duracionHoras: typeof v?.duracionHoras === 'number' ? v.duracionHoras : undefined,
            descripcion: v?.descripcion || undefined,
          }))
          .filter(p => p.nombre);

        if (payloads.length === 0) {
          this.saving = false;
          this.activeModal.close({ action: 'completed', templateId });
          return;
        }

        forkJoin(payloads.map(p => this.templateTaskDetailService.createTemplateTaskDetail(p).pipe(catchError(() => of(null)))))
          .pipe(finalize(() => { this.saving = false; }))
          .subscribe(() => {
            this.activeModal.close({ action: 'completed', templateId });
          });
      });
  }
}