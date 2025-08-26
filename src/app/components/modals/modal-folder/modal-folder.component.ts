import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/service/core/auth/Auth.service';

@Component({
  selector: 'app-modal-folder',
  templateUrl: './modal-folder.component.html',
  styleUrls: ['./modal-folder.component.scss']
})
export class ModalFolderComponent {
  @Input() title: string = 'Create New Folder';
  @Input() SelectedWorkspace: any; 
  @Input() SelectedSpace: any; 
  @Input() isEditMode: boolean = false;
  @Input() SelectedFolder: any; // when edit

  folderForm: FormGroup;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.folderForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      publico: [true],
      estado: ['Activo']
    });
  }

  ngOnInit() {
    if (this.isEditMode && this.SelectedFolder) {
      this.title = this.title || 'Edit Folder';
      const f = this.SelectedFolder;
      this.folderForm.patchValue({
        nombre: f.nombre || '',
        descripcion: f.descripcion || '',
        publico: typeof f.publico === 'boolean' ? f.publico : true,
        estado: f.estado || 'Activo'
      });
    }
  }

  onSubmit() {
    if (this.folderForm.valid && this.SelectedWorkspace && this.SelectedSpace) {
      const currentUser = this.authService.getCurrentUser();
      const raw = this.folderForm.value;

      const nombreLimpio = (raw.nombre || '').trim();
      if (this.isEditMode && this.SelectedFolder) {
        const data = {
          identificador: this.SelectedFolder.identificador,
          estado: raw.estado,
          espacioTrabajoId: this.SelectedWorkspace.id || this.SelectedWorkspace.espacio_trabajo_id || null,
          espacioId: this.SelectedSpace.id || this.SelectedSpace.espacio_id || null,
          nombre: nombreLimpio,
          descripcion: raw.descripcion,
          organizacionId: this.SelectedFolder.organizacionId || currentUser?.organizacionId,
          clienteId: this.SelectedFolder.clienteId || currentUser?.clienteId,
          espacioTrabajoIdentificador: this.SelectedWorkspace.identificador || this.SelectedWorkspace.espacio_trabajo_identificador,
          espacioIdentificador: this.SelectedSpace.identificador || this.SelectedSpace.espacio_identificador,
          publico: !!raw.publico
        };
        this.activeModal.close(data);
      } else {
        const identificador = this.makeIdFromName(nombreLimpio || 'folder');
        const data = {
          identificador,
          estado: raw.estado,
          espacioTrabajoId: this.SelectedWorkspace.id || this.SelectedWorkspace.espacio_trabajo_id || null,
          espacioId: this.SelectedSpace.id || this.SelectedSpace.espacio_id || null,
          nombre: nombreLimpio,
          descripcion: raw.descripcion,
          organizacionId: currentUser?.organizacionId,
          clienteId: currentUser?.clienteId,
          espacioTrabajoIdentificador: this.SelectedWorkspace.identificador || this.SelectedWorkspace.espacio_trabajo_identificador,
          espacioIdentificador: this.SelectedSpace.identificador || this.SelectedSpace.espacio_identificador,
          publico: !!raw.publico
        };
        this.activeModal.close(data);
      }
    } else {
      Object.keys(this.folderForm.controls).forEach(k => this.folderForm.get(k)?.markAsTouched());
    }
  }

  onCancel() {
    this.activeModal.dismiss();
  }

  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.folderForm.get(fieldName);
    if (errorType) {
      return field ? field.hasError(errorType) && field.touched : false;
    }
    return field ? field.invalid && field.touched : false;
  }

  private makeIdFromName(value: string): string {
    const slug = value
      .toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 24);
    const short = (Date.now().toString(36) + Math.random().toString(36).slice(2)).slice(-6);
    return `${slug}-${short}`;
  }
}
