import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalTaskComponent } from './modal-task.component';

describe('ModalTaskComponent', () => {
  let component: ModalTaskComponent;
  let fixture: ComponentFixture<ModalTaskComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalTaskComponent]
    });
    fixture = TestBed.createComponent(ModalTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
