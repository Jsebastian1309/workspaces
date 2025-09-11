import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WizardStatesComponent } from './wizard-states.component';

describe('WizardStatesComponent', () => {
  let component: WizardStatesComponent;
  let fixture: ComponentFixture<WizardStatesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WizardStatesComponent]
    });
    fixture = TestBed.createComponent(WizardStatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
