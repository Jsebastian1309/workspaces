import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-create-space',
  templateUrl: './create-space.component.html',
  styleUrls: ['./create-space.component.scss']
})
export class CreateSpaceComponent {
  @Input() title: string = ''; // Recibir información del modal
  spaceName: string = '';

  constructor(public activeModal: NgbActiveModal) {}

  createSpace() {
    if (this.spaceName.trim()) {
      this.activeModal.close(this.spaceName); // Devolver el resultado al cerrar el modal
    }
  }

  closeModal() {
    this.activeModal.dismiss(); // Dismiss sin devolver resultado
  }
}