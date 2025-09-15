import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalTemplateTaskComponent } from './modal-template-task.component';

describe('ModalTemplateTaskComponent', () => {
  let component: ModalTemplateTaskComponent;
  let fixture: ComponentFixture<ModalTemplateTaskComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalTemplateTaskComponent]
    });
    fixture = TestBed.createComponent(ModalTemplateTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
