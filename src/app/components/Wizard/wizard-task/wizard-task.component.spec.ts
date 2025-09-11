import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WizardTaskComponent } from './wizard-task.component';

describe('WizardTaskComponent', () => {
  let component: WizardTaskComponent;
  let fixture: ComponentFixture<WizardTaskComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WizardTaskComponent]
    });
    fixture = TestBed.createComponent(WizardTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
