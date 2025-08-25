import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-modal-delete',
  templateUrl: './modal-delete.component.html',
  styleUrls: ['./modal-delete.component.scss']
})
export class ModalDeleteComponent {
  @Input() title: string = 'Delete';
  @Input() message: string = 'Are you sure you want to delete this item?';
  @Input() confirmLabel: string = 'Delete';
  @Input() cancelLabel: string = 'Cancel';

  constructor(public activeModal: NgbActiveModal) {}

  onConfirm() { this.activeModal.close(true); }
  onCancel() { this.activeModal.dismiss(false); }
}