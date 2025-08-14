import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WorkspaceService } from '../../service/space.service';

@Component({
  selector: 'app-create-space',
  templateUrl: './create-space.component.html',
  styleUrls: ['./create-space.component.scss']
})
export class CreateSpaceComponent {
  @Input() title: string = 'Create New Space';
  @Input() SelectedWorkspace: any; // Workspace seleccionado
  
  spaceForm: FormGroup;
  

  categorias = ['Proyecto', 'Equipo', 'Personal', 'Cliente', 'Marketing', 'Desarrollo'];

  
  constructor(
    public activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private workspaceService: WorkspaceService
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
  }

  onSubmit() {
    if (this.spaceForm.valid && this.SelectedWorkspace) {
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
      this.workspaceService.CreateSpace(spaceData).subscribe({
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