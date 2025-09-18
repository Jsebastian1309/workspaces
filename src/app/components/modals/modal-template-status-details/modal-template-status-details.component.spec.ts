import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalTemplateStatusDetailsComponent } from './modal-template-status-details.component';

describe('ModalTemplateStatusDetailsComponent', () => {
  let component: ModalTemplateStatusDetailsComponent;
  let fixture: ComponentFixture<ModalTemplateStatusDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalTemplateStatusDetailsComponent]
    });
    fixture = TestBed.createComponent(ModalTemplateStatusDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
