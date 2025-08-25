import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SpaceService } from 'src/app/service/space.service';

@Component({
  selector: 'app-modal-space',
  templateUrl: './modal-space.component.html',
  styleUrls: ['./modal-space.component.scss']
})
export class ModalSpaceComponent {
  @Input() title: string = 'Create New Space';
  @Input() SelectedWorkspace: any; // Workspace seleccionado
  @Input() isEditMode: boolean = false; // Modo edición similar a workspaces
  @Input() spaceData: any = null; // Datos del space a editar
  
  spaceForm: FormGroup;
  

  categorias = ['Proyecto', 'Equipo', 'Personal', 'Cliente', 'Marketing', 'Desarrollo'];

  
  constructor(
    public activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private spaceService: SpaceService
  ) {
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

  ngOnInit() {
    console.log('Workspace seleccionado para el space:', this.SelectedWorkspace);
    if (this.isEditMode && this.spaceData) {
      // Precargar valores existentes del space
      this.spaceForm.patchValue({
        nombre: this.spaceData.nombre || '',
        descripcion: this.spaceData.descripcion || '',
        categoria: this.spaceData.categoria || 'Proyecto',
        color: this.spaceData.color || '#ff6b6b',
        icono: this.spaceData.icono || 'bi-house',
        publico: this.spaceData.publico ?? true,
        estado: this.spaceData.estado || 'Activo'
      });
    }
  }

  onSubmit() {
    if (this.spaceForm.valid && this.SelectedWorkspace) {
      if (this.isEditMode && this.spaceData) {
        // Actualización
        const raw = this.spaceForm.value;
        const payload = {
          identificador: this.spaceData.identificador,
          nombre: raw.nombre,
          categoria: raw.categoria,
          color: raw.color,
          icono: raw.icono,
          publico: raw.publico,
          estado: raw.estado,
          descripcion: raw.descripcion,
          organizacionId: this.spaceData.organizacionId || this.SelectedWorkspace.organizacionId || this.SelectedWorkspace.organizacion_id,
          clienteId: this.spaceData.clienteId || this.SelectedWorkspace.clienteId || this.SelectedWorkspace.cliente_id,
          espacioTrabajoIdentificador: this.spaceData.espacioTrabajoIdentificador || this.SelectedWorkspace.identificador || this.SelectedWorkspace.espacio_trabajo_identificador
        };

        console.log('Actualizando space con datos:', payload);
        this.spaceService.updateSpace(payload).subscribe({
          next: (resp) => {
            this.activeModal.close(resp || payload);
          },
          error: (err) => {
            console.error('Error al actualizar space:', err);
            // Cerrar igual con payload para que el padre pueda refrescar
            this.activeModal.close(payload);
          }
        });
      } else {
        // Creación
        const spaceData = {
          ...this.spaceForm.value,
          // IDs del workspace seleccionado en camelCase
          espacioTrabajoId: this.SelectedWorkspace.id || this.SelectedWorkspace.espacio_trabajo_id || null,
          espacioTrabajoIdentificador: this.SelectedWorkspace.identificador || this.SelectedWorkspace.espacio_trabajo_identificador,
          organizacionId: this.SelectedWorkspace.organizacionId || this.SelectedWorkspace.organizacion_id,
          clienteId: this.SelectedWorkspace.clienteId || this.SelectedWorkspace.cliente_id
        };
        
        console.log('Creando space con datos:', spaceData);
        
        // Llamar al servicio para crear el space
        this.spaceService.CreateSpace(spaceData).subscribe({
          next: (response) => {
            console.log('Space creado exitosamente:', response);
            this.activeModal.close(response);
          },
          error: (error) => {
            console.error('Error al crear space:', error);
            // Cerrar modal con los datos para que el componente padre maneje el error
            this.activeModal.close(spaceData);
          }
        });
      }
    } else {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.spaceForm.controls).forEach(key => {
        this.spaceForm.get(key)?.markAsTouched();
      });

      if (!this.SelectedWorkspace) {
        console.error('No hay workspace seleccionado');
      }
    }
  }

  onCancel() {
    this.activeModal.dismiss();
  }

  // Helper para verificar si un campo tiene errores
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.spaceForm.get(fieldName);
    if (errorType) {
      return field ? field.hasError(errorType) && field.touched : false;
    }
    return field ? field.invalid && field.touched : false;
  }

  // Color names helper is no longer needed; the picker shows selection.

  obtenerInicial(nombre?: string): string {
    return nombre ? nombre.charAt(0).toUpperCase() : 'W';
  }
}