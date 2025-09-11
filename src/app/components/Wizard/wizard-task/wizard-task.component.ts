import { Component, EventEmitter, Optional, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TemplateStatusService } from 'src/app/service/features/template/status/template-status.service';
import { TemplateStatusDetailService } from 'src/app/service/features/template/status/template-statusdetail.service';
import { AuthService } from 'src/app/service/core/auth/auth.service';
import { UniqueIdService } from 'src/app/service/core/utils/uniqueId.service';

@Component({
  selector: 'app-wizard-task',
  templateUrl: './wizard-task.component.html',
  styleUrls: ['./wizard-task.component.scss']
})
export class WizardTaskComponent {
}