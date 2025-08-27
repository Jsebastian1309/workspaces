import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GantViewComponent } from './gant-view.component';

describe('GantViewComponent', () => {
  let component: GantViewComponent;
  let fixture: ComponentFixture<GantViewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GantViewComponent]
    });
    fixture = TestBed.createComponent(GantViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
