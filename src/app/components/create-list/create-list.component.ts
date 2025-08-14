import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

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
    private fb: FormBuilder
  ) {
    this.listForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      publico: [true]
    });
  }

  onSubmit() {
    if (this.listForm.valid) {
      this.activeModal.close(this.listForm.value);
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
