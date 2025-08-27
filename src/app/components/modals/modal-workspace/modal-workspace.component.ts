import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/service/core/auth/auth.service';

@Component({
  selector: 'app-modal-workspace',
  templateUrl: './modal-workspace.component.html',
  styleUrls: ['./modal-workspace.component.scss']
})
export class ModalWorkspaceComponent implements OnInit, OnChanges {
  @Input() title: string = '';
  @Input() workspaceData: any = null;
  @Input() isEditMode: boolean = false;
  workspaceForm: FormGroup;

  constructor(
    public activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {

    // Obtener el Organizacion y cliente
    const currentUser = this.authService.getCurrentUser();

    // Formulario reactivo
    this.workspaceForm = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      categoria: ['', Validators.required],
      organizacionId: [{ value: currentUser?.organizacionId, disabled: true }],
      clienteId: [{ value: currentUser?.clienteId, disabled: true }],
      color: ['#007bff', Validators.required],
      icono: ['bi-house', Validators.required],
      publico: [true],
      estado: ['Activo'],
    });
  }

  // Cargar datos en el formulario si estamos en modo edición
  ngOnInit() {
    this.patchFromInput();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['workspaceData'] || changes['isEditMode']) {
      this.patchFromInput();
    }
  }

  patchFromInput() {
    if (this.isEditMode && this.workspaceData) {
      this.workspaceForm.patchValue({
        nombre: this.workspaceData.nombre,
        categoria: this.workspaceData.categoria,
        color: this.workspaceData.color,
        icono: this.workspaceData.icono,
        publico: this.workspaceData.publico,
        estado: this.workspaceData.estado,
        organizacionId: this.workspaceData.organizacion_id ?? this.workspaceData.organizacionId,
        clienteId: this.workspaceData.cliente_id ?? this.workspaceData.clienteId
      });
    }
  }


  // Enviar datos del formulario
  onSubmit() {
    if (this.workspaceForm.valid) {
      const formValue = this.workspaceForm.getRawValue();
      if (this.isEditMode && this.workspaceData) {
        this.activeModal.close({
          ...this.workspaceData,
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
