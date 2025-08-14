import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ListService } from '../../service/list.service';
import { AuthService } from '../../service/AuthService.service';

@Component({
  selector: 'app-create-list',
  templateUrl: './create-list.component.html',
  styleUrls: ['./create-list.component.scss']
})
export class CreateListComponent {
  @Input() title: string = 'Create New List';
  @Input() SelectedWorkspace: any;
  @Input() SelectedSpace: any;
  @Input() SelectedFolder: any;

  listForm: FormGroup;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private listService: ListService,
    private authService: AuthService
  ) {
    this.listForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      publico: [true],
      estado: ['Activo']
    });
  }

  onSubmit() {
    if (this.listForm.valid && this.SelectedFolder) {
      const currentUser = this.authService.getCurrentUser();
      const raw = this.listForm.value;

      const nombreLimpio = (raw.nombre || '').trim();
      const payload = {
        nombre: nombreLimpio,
        descripcion: raw.descripcion,
        publico: !!raw.publico,
        estado: raw.estado,
        organizacionId: currentUser?.organizacion_id,
        clienteId: currentUser?.cliente_id,
        carpetaIdentificador: this.SelectedFolder.identificador || this.SelectedFolder.carpeta_identificador,
        carpetaId: this.SelectedFolder.id || this.SelectedFolder.carpeta_id
      };

      this.listService.createList(payload).subscribe({
        next: (resp) => this.activeModal.close(resp),
        error: (err) => {
          console.error('Error creando la lista', err);
          // Devuelve payload para que el caller pueda manejarlo
          this.activeModal.close(payload);
        }
      });
    } else {
      Object.keys(this.listForm.controls).forEach(k => this.listForm.get(k)?.markAsTouched());
    }
  }

  onCancel() { this.activeModal.dismiss(); }

  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.listForm.get(fieldName);
    if (errorType) {
      return field ? field.hasError(errorType) && field.touched : false;
    }
    return field ? field.invalid && field.touched : false;
  }
}
