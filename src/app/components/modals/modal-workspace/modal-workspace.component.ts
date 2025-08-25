import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/service/AuthService.service';

@Component({
  selector: 'app-modal-workspace',
  templateUrl: './modal-workspace.component.html',
  styleUrls: ['./modal-workspace.component.scss']
})
export class ModalWorkspaceComponent implements OnInit {
  @Input() title: string = '';
  @Input() workspaceData: any = null; 
  @Input() isEditMode: boolean = false; 
  workspaceForm: FormGroup;

  constructor(
    public activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {
    const currentUser = this.authService.getCurrentUser();
    this.workspaceForm = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      categoria: ['', Validators.required],
      organizacion_id: [{ value: currentUser?.organizacion_id, disabled: true }],
      cliente_id: [{ value: currentUser?.cliente_id, disabled: true }],
      color: ['#007bff', Validators.required],
      icono: ['bi-house', Validators.required],
      publico: [true],
      estado: ['Activo'],
      usuario_creacion: [{ value: currentUser?.username}]
    });
  }

  ngOnInit() {
    if (this.isEditMode && this.workspaceData) {
      this.workspaceForm.patchValue({
        nombre: this.workspaceData.nombre,
        categoria: this.workspaceData.categoria,
        color: this.workspaceData.color,
        icono: this.workspaceData.icono,
        publico: this.workspaceData.publico,
        estado: this.workspaceData.estado,
        organizacion_id: this.workspaceData.organizacion_id || this.workspaceData.organizacionId,
        cliente_id: this.workspaceData.cliente_id || this.workspaceData.clienteId
      });
    }
  }

  onSubmit() {
    if (this.workspaceForm.valid) {
      const raw = this.workspaceForm.getRawValue();
      const currentUser = this.authService.getCurrentUser();

      let workspaceData;

      if (this.isEditMode) {
        // En modo edición, mantener datos existentes y solo actualizar los campos editables
        workspaceData = {
          ...this.workspaceData,
          nombre: raw.nombre,
          categoria: raw.categoria,
          color: raw.color,
          icono: raw.icono,
          publico: raw.publico,
          estado: raw.estado
        };
      } else {
        // Modo creación: generar nuevos identificadores
        const nombreLimpio = (raw.nombre || '').trim();
        const slug = this.slugify(nombreLimpio || 'workspace');
        const uid = `${slug}-${this.makeShortId(6)}`;

        workspaceData = {
          ...raw,
          organizacionId: currentUser?.organizacion_id,
          clienteId: currentUser?.cliente_id,
          usuario_creacion: currentUser?.username,
          identificador: uid
        };
      }

      this.activeModal.close(workspaceData);
    } else {
      Object.keys(this.workspaceForm.controls).forEach(key => {
        this.workspaceForm.get(key)?.markAsTouched();
      });
    }
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') 
      .replace(/[^a-z0-9]+/g, '-')                     
      .replace(/^-+|-+$/g, '')                         
      .substring(0, 24);                            
  }

  private makeShortId(length = 6): string {
    const seed = Date.now().toString(36) + Math.random().toString(36).slice(2);
    return seed.slice(-length);
  }

  onCancel() {
    this.activeModal.dismiss();
  }


  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.workspaceForm.get(fieldName);
    if (errorType) {
      return field ? field.hasError(errorType) && field.touched : false;
    }
    return field ? field.invalid && field.touched : false;
  }

}
