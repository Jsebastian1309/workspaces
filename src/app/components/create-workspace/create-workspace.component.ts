import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../service/AuthService.service';

@Component({
  selector: 'app-create-workspace',
  templateUrl: './create-workspace.component.html',
  styleUrls: ['./create-workspace.component.scss']
})
export class CreateWorkspaceComponent implements OnInit {
  @Input() title: string = 'Create New Workspace';
  
  workspaceForm: FormGroup;
  
  // Opciones predefinidas

  colores = ['Blue', 'Green', 'Red', 'Orange', 'Purple', 'Pink', 'Cyan', 'Yellow'];
  
  constructor(
    public activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {
    // Obtener información del usuario logueado
    const currentUser = this.authService.getCurrentUser();
    
    this.workspaceForm = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      categoria: ['', Validators.required],
      organizacion_id: [currentUser?.organizacion_id || 'WOG', Validators.required],
      cliente_id: [currentUser?.cliente_id || '', Validators.required],
      color: ['Blue', Validators.required],
      icono: ['', Validators.required],
      publico: [true],
      estado: ['Activo'],
      usuario_creacion: [currentUser?.username || 'unknown'] // Automaticamente del usuario logueado
    });
  }

  ngOnInit() {
    // Auto-generar icono basado en el nombre
    this.workspaceForm.get('nombre')?.valueChanges.subscribe(nombre => {
      if (nombre && nombre.length > 0) {
        this.workspaceForm.patchValue({
          icono: nombre.charAt(0).toUpperCase()
        });
      }
    });
  }

  onSubmit() {
    if (this.workspaceForm.valid) {
      const workspaceData = this.workspaceForm.value;
      this.activeModal.close(workspaceData);
    } else {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.workspaceForm.controls).forEach(key => {
        this.workspaceForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel() {
    this.activeModal.dismiss();
  }

  // Helper para verificar si un campo tiene errores
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.workspaceForm.get(fieldName);
    if (errorType) {
      return field ? field.hasError(errorType) && field.touched : false;
    }
    return field ? field.invalid && field.touched : false;
  }

  // Helper para obtener el valor del color
  getColorValue(colorName: string): string {
    const colorMap: { [key: string]: string } = {
      'Blue': '#007bff',
      'Green': '#28a745',
      'Red': '#dc3545',
      'Orange': '#fd7e14',
      'Purple': '#6f42c1',
      'Pink': '#e83e8c',
      'Cyan': '#17a2b8',
      'Yellow': '#ffc107'
    };
    return colorMap[colorName] || '#4f46e5';
  }
}
