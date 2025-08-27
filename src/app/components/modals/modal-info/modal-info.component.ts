import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

type InfoType = 'success' | 'info' | 'warning' | 'error';

@Component({
  selector: 'app-modal-info',
  templateUrl: './modal-info.component.html',
  styleUrls: ['./modal-info.component.scss']
})
export class ModalInfoComponent {
 @Input() title: string = '';
  @Input() description: string = '';
  @Input() type: InfoType = 'info';
  @Input() buttonLabel: string = 'Accept';

  constructor(public activeModal: NgbActiveModal) {}

  get iconClass(): string {
    switch (this.type) {
      case 'success': return 'bi-check-circle';
      case 'warning': return 'bi-exclamation-triangle';
      case 'error': return 'bi-x-circle';
      default: return 'bi-info-circle';
    }
  }

  onAccept() { this.activeModal.close(true); }
  onCancel() { this.activeModal.dismiss(); }
}