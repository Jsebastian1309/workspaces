import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/service/core/auth/auth.service';

@Component({
  selector: 'app-modal-person',
  templateUrl: './modal-person.component.html',
  styleUrls: ['./modal-person.component.scss']
})
export class ModalPersonComponent implements OnInit, OnChanges {
  @Input() title: string = '';
  @Input() team: any = null; // team object for edit
  @Input() isEditMode: boolean = false;
  workspaceForm: FormGroup;

  constructor(
    public activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {

    // Obtener Organizacion y cliente del token
    const currentUser = this.authService.getCurrentUser();

    // Formulario reactivo adaptado para Team (persona)
    this.workspaceForm = this.formBuilder.group({
      identificador: [null],
      nombres: ['', [Validators.required, Validators.maxLength(100)]],
      apellidos: ['', [Validators.maxLength(100)]],
      correo: ['', [Validators.email, Validators.maxLength(150)]],
      celular: ['', [Validators.maxLength(30)]],
      valorHora: [null, [Validators.min(0)]],
      estado: [true],
      organizacionId: [{ value: currentUser?.organizacionId, disabled: true }],
      clienteId: [{ value: currentUser?.clienteId, disabled: true }],
    });
  }

  // Cargar datos en el formulario si estamos en modo edición
  ngOnInit() {
    this.patchFromInput();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['team'] || changes['isEditMode']) {
      this.patchFromInput();
    }
  }

  patchFromInput() {
    if (this.isEditMode && this.team) {
      this.workspaceForm.patchValue({
        identificador: this.team.identificador,
        nombres: this.team.nombres,
        apellidos: this.team.apellidos,
        correo: this.team.correo,
        celular: this.team.celular,
        valorHora: this.team.valorHora,
        estado: this.team.estado,
        organizacionId: this.team.organizacionId ?? this.team.organizacion_id,
        clienteId: this.team.clienteId ?? this.team.cliente_id,
      });
    }
  }


  // Enviar datos del formulario
  onSubmit() {
    if (this.workspaceForm.valid) {
      const formValue = this.workspaceForm.getRawValue();
      if (this.isEditMode && this.team) {
        this.activeModal.close({
          ...this.team,
          ...formValue,
        });
      } else {
        this.activeModal.close(formValue);
      }
    } else {
      Object.values(this.workspaceForm.controls).forEach(control => {
        control.markAsTouched();
      });
    }
  }

  // Cancelar
  onCancel() {
    this.activeModal.dismiss();
  }

  // Verificar errores en el formulario
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.workspaceForm.get(fieldName);
    if (errorType) {
      return field ? field.hasError(errorType) && field.touched : false;
    }
    return field ? field.invalid && field.touched : false;
  }
}
