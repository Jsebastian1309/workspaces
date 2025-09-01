import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalPersonComponent} from './modal-person.component';

describe('ModalPersonComponent', () => {
  let component: ModalPersonComponent;
  let fixture: ComponentFixture<ModalPersonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalPersonComponent]
    });
    fixture = TestBed.createComponent(ModalPersonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
