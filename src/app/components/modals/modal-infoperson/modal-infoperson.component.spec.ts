import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalInfopersonComponent } from './modal-infoperson.component';

describe('ModalInfopersonComponent', () => {
  let component: ModalInfopersonComponent;
  let fixture: ComponentFixture<ModalInfopersonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalInfopersonComponent]
    });
    fixture = TestBed.createComponent(ModalInfopersonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
