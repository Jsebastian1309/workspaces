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
      nombre: ['', [Validators.required, Validators.maxLength(15)]]
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
    // No creamos cabecera acá. Solo pasamos al paso 2.
    this.step = 2;
    // Agregar una fila por defecto si no hay
    if (this.detailsFormArray.length === 0) {
      this.addDetail();
    }
  }

  // Step 2: Manage details
  addDetail() {
    this.detailsFormArray.push(
      this.fb.group({
        nombre: ['', [Validators.required, Validators.maxLength(100)]],
        color: ['#3f51b5', [Validators.required]],
      })
    );
  }

  removeDetail(index: number) {
    this.detailsFormArray.removeAt(index);
  }

  moveDetailUp(index: number) {
    if (index <= 0) return;
    const ctrl = this.detailsFormArray.at(index);
    this.detailsFormArray.removeAt(index);
    this.detailsFormArray.insert(index - 1, ctrl);
  }

  moveDetailDown(index: number) {
    if (index >= this.detailsFormArray.length - 1) return;
    const ctrl = this.detailsFormArray.at(index);
    this.detailsFormArray.removeAt(index);
    this.detailsFormArray.insert(index + 1, ctrl);
  }

  saveDetails() {
    this.serverMessage = null;
    // Creamos cabecera aquí y luego detalles. Si falla detalles, eliminamos cabecera.
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
    const nombreHeader = this.headerForm.value.nombre?.trim();

    // 1) Crear cabecera
    this.templateStatusService.createTemplateStatus({ nombre: nombreHeader }).subscribe({
      next: (resp) => {
        const headerId = resp?.identificador || this.uniqueIdService.generateId(nombreHeader);
        this.headerIdentificador = headerId;

        // 2) Crear detalles
        const calls = this.detailsControls.map((group, idx) => {
          const nombre = group.value.nombre?.trim();
          const payload = {
            organizacionId: user?.organizacionId,
            clienteId: user?.clienteId,
            templateEstadoIdentificador: headerId,
            identificador: this.uniqueIdService.generateId(nombre),
            secuencia: idx + 1,
            nombre,
            color: group.value.color
          };
          return this.templateStatusDetailService.createTemplateStatusDetail(payload);
        });

        forkJoin(calls).subscribe({
          next: () => {
            this.isSubmittingDetails = false;
            this.serverMessage = { type: 'success', text: 'Plantilla creada correctamente.' };
            this.completed.emit();
            this.resetWizard();
            this.activeModal?.close('completed');
          },
          error: (err) => {
            // 3) Si falla detalles, intentamos borrar cabecera para evitar orfandad
            console.error('Error guardando detalles', err);
            this.templateStatusService.deleteTemplateStatus(headerId).subscribe({
              complete: () => {
                this.isSubmittingDetails = false;
                this.serverMessage = { type: 'error', text: err?.error?.message || 'No se pudieron guardar los detalles.' };
              }
            });
          }
        });
      },
      error: (err) => {
        this.isSubmittingDetails = false;
        this.serverMessage = { type: 'error', text: err?.error?.message || 'No se pudo crear la cabecera.' };
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


