import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalTemplateTaskDetailsComponent } from './modal-template-task-details.component';

describe('ModalTemplateTaskDetailsComponent', () => {
  let component: ModalTemplateTaskDetailsComponent;
  let fixture: ComponentFixture<ModalTemplateTaskDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalTemplateTaskDetailsComponent]
    });
    fixture = TestBed.createComponent(ModalTemplateTaskDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
