import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalWorkspaceComponent } from './modal-workspace.component';

describe('ModalWorkspaceComponent', () => {
  let component: ModalWorkspaceComponent;
  let fixture: ComponentFixture<ModalWorkspaceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalWorkspaceComponent]
    });
    fixture = TestBed.createComponent(ModalWorkspaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
