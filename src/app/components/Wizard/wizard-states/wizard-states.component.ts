import { Component, EventEmitter, Optional, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin } from 'rxjs';
import { AuthService } from 'src/app/service/core/auth/auth.service';
import { UniqueIdService } from 'src/app/service/core/utils/uniqueId.service';
import { TemplateStatusService } from 'src/app/service/features/template/status/template-status.service';
import { TemplateStatusDetailService } from 'src/app/service/features/template/status/template-statusdetail.service';

@Component({
  selector: 'app-wizard-states',
  templateUrl: './wizard-states.component.html',
  styleUrls: ['./wizard-states.component.scss']
})
export class WizardStatesComponent {
  step: 1 | 2 = 1;
  headerForm: FormGroup;
  detailsFormArray: FormArray;
  isSubmittingHeader = false;
  isSubmittingDetails = false;
  headerIdentificador: string | null = null;
  serverMessage: { type: 'success' | 'error'; text: string } | null = null;
  @Output() completed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    private templateStatusService: TemplateStatusService,
    private templateStatusDetailService: TemplateStatusDetailService,
    private authService: AuthService,
  private uniqueIdService: UniqueIdService,
  @Optional() public activeModal?: NgbActiveModal 
  ) {
    this.headerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]]
    });

    this.detailsFormArray = this.fb.array([]);
  }

  // Convenience getters
  get detailsControls() {
    return this.detailsFormArray.controls as FormGroup[];
  }

  // Step 1: Create header
  submitHeader() {
    this.serverMessage = null;
    if (this.headerForm.invalid) {
      this.headerForm.markAllAsTouched();
      return;
    }
    this.isSubmittingHeader = true;
    const nombre = this.headerForm.value.nombre?.trim();

    this.templateStatusService.createTemplateStatus({ nombre }).subscribe({
      next: (resp) => {
        // Any 200 is success; use identificador from service or fallback
        this.headerIdentificador = resp?.identificador || this.uniqueIdService.generateId(nombre);
        this.step = 2;
        this.isSubmittingHeader = false;
        // Start with one empty detail row by default
        if (this.detailsFormArray.length === 0) {
          this.addDetail();
        }
      },
      error: (err) => {
        this.isSubmittingHeader = false;
        this.serverMessage = { type: 'error', text: err?.error?.message || 'No se pudo crear la cabecera.' };
      }
    });
  }

  // Step 2: Manage details
  addDetail() {
    const idx = this.detailsFormArray.length + 1;
    this.detailsFormArray.push(
      this.fb.group({
        nombre: ['', [Validators.required, Validators.maxLength(100)]],
        color: ['#3f51b5', [Validators.required]],
  secuencia: [idx, [Validators.required, Validators.min(0)]]
      })
    );
  }

  removeDetail(index: number) {
    this.detailsFormArray.removeAt(index);
    this.resequence();
  }

  moveDetailUp(index: number) {
    if (index <= 0) return;
    const ctrl = this.detailsFormArray.at(index);
    this.detailsFormArray.removeAt(index);
    this.detailsFormArray.insert(index - 1, ctrl);
    this.resequence();
  }

  moveDetailDown(index: number) {
    if (index >= this.detailsFormArray.length - 1) return;
    const ctrl = this.detailsFormArray.at(index);
    this.detailsFormArray.removeAt(index);
    this.detailsFormArray.insert(index + 1, ctrl);
    this.resequence();
  }

  private resequence() {
    this.detailsControls.forEach((g, i) => g.get('secuencia')?.setValue(i + 1));
  }

  saveDetails() {
    this.serverMessage = null;
    if (!this.headerIdentificador) {
      this.serverMessage = { type: 'error', text: 'Falta el identificador de la cabecera.' };
      return;
    }
    if (this.detailsFormArray.length === 0) {
      this.serverMessage = { type: 'error', text: 'Agrega al menos un detalle.' };
      return;
    }
    if (this.detailsFormArray.invalid) {
      this.detailsFormArray.markAllAsTouched();
      return;
    }

    this.isSubmittingDetails = true;
    const user = this.authService.getCurrentUser();

    const calls = this.detailsControls.map((group) => {
      const nombre = group.value.nombre?.trim();
      const payload = {
        organizacionId: user?.organizacionId,
        clienteId: user?.clienteId,
        templateEstadoIdentificador: this.headerIdentificador,
        identificador: this.uniqueIdService.generateId(nombre),
        secuencia: group.value.secuencia,
        nombre,
        color: group.value.color
      };
      return this.templateStatusDetailService.createTemplateStatusDetail(payload);
    });

    forkJoin(calls).subscribe({
      next: () => {
        this.isSubmittingDetails = false;
        this.serverMessage = { type: 'success', text: 'Plantilla creada correctamente.' };
  // Notify parent and reset
  this.completed.emit();
  this.resetWizard();
  // Close modal if present
  this.activeModal?.close('completed');
      },
      error: (err) => {
        this.isSubmittingDetails = false;
        this.serverMessage = { type: 'error', text: err?.error?.message || 'No se pudieron guardar los detalles.' };
  console.error('Error guardando detalles', err);
      }
    });
  }

  backToHeader() {
    this.step = 1;
  }

  resetWizard() {
    this.step = 1;
    this.headerIdentificador = null;
    this.headerForm.reset();
    while (this.detailsFormArray.length) this.detailsFormArray.removeAt(0);
  }

  cancelWizard() {
    this.cancelled.emit();
    this.resetWizard();
  // Dismiss modal if present
  this.activeModal?.dismiss('cancelled');
  }
}


