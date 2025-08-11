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
  @Input() espacioTrabajoSeleccionado: any; // Workspace seleccionado
  
  spaceForm: FormGroup;
  
  // Opciones predefinidas
  categorias = ['Proyecto', 'Equipo', 'Personal', 'Cliente', 'Marketing', 'Desarrollo'];
  colores = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#ff6348'];
  
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
      icono: ['', Validators.required],
      publico: [true],
      estado: ['Activo']
    });
  }

  ngOnInit() {
    // Auto-generar icono basado en el nombre
    this.spaceForm.get('nombre')?.valueChanges.subscribe(nombre => {
      if (nombre && nombre.length > 0) {
        this.spaceForm.patchValue({
          icono: nombre.charAt(0).toUpperCase()
        });
      }
    });

    console.log('Workspace seleccionado para el space:', this.espacioTrabajoSeleccionado);
  }

  onSubmit() {
    if (this.spaceForm.valid && this.espacioTrabajoSeleccionado) {
      const spaceData = {
        ...this.spaceForm.value,
        espacioTrabajoId: this.espacioTrabajoSeleccionado.id,
        espacioTrabajoIdentificador: this.espacioTrabajoSeleccionado.identificador,
        organizacionId: this.espacioTrabajoSeleccionado.organizacionId,
        clienteId: this.espacioTrabajoSeleccionado.clienteId
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

      if (!this.espacioTrabajoSeleccionado) {
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

  // Helper para obtener el valor del color en hexadecimal
  getColorName(colorHex: string): string {
    const colorMap: { [key: string]: string } = {
      '#ff6b6b': 'Red',
      '#4ecdc4': 'Teal', 
      '#45b7d1': 'Blue',
      '#96ceb4': 'Green',
      '#feca57': 'Yellow',
      '#ff9ff3': 'Pink',
      '#54a0ff': 'Light Blue',
      '#ff6348': 'Orange'
    };
    return colorMap[colorHex] || 'Custom';
  }
}