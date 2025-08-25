import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SpaceService } from 'src/app/service/features/space/Space.service';

@Component({
  selector: 'app-modal-space',
  templateUrl: './modal-space.component.html',
  styleUrls: ['./modal-space.component.scss']
})
export class ModalSpaceComponent {
  @Input() title: string = '';
  @Input() SelectedWorkspace: any;
  @Input() isEditMode: boolean = false;
  @Input() spaceData: any = null;
  spaceForm: FormGroup;

  constructor(
    public activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
  ) {

    // Formulario reactivo
    this.spaceForm = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      categoria: ['Proyecto', Validators.required],
      color: ['#ff6b6b', Validators.required],
      icono: ['bi-house', Validators.required],
      publico: [true],
      estado: ['Activo']
    });
  }

  // Cargar datos en el formulario si estamos en modo edición
  ngOnInit() {
    this.patchFromInput();
  }


  patchFromInput() {
    if (this.isEditMode && this.spaceData) {
      this.spaceForm.patchValue({
        nombre: this.spaceData.nombre,
        descripcion: this.spaceData.descripcion,
        color: this.spaceData.color,
        icono: this.spaceData.icono,
        publico: this.spaceData.publico,
        estado: this.spaceData.estado
      });
    }
  }

  // Enviar datos del formulario
  onSubmit() {
    if (this.spaceForm.valid) {
      const formValue = this.spaceForm.getRawValue();
      if (this.isEditMode && this.spaceData) {
        this.activeModal.close({
          ...this.spaceData,
          ...formValue,
        });
      } else {
        this.activeModal.close({
          ...formValue,
          espacioTrabajoIdentificador: this.SelectedWorkspace?.identificador
        });
      }
    } else {
      Object.values(this.spaceForm.controls).forEach(control => control.markAsTouched());
    }
  }

  // Cancelar
  onCancel() {
    this.activeModal.dismiss();
  }

  // Verificar errores en el formulario
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.spaceForm.get(fieldName);
    if (errorType) {
      return field ? field.hasError(errorType) && field.touched : false;
    }
    return field ? field.invalid && field.touched : false;
  }
}

