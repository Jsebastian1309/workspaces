import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemeButtonComponent } from './theme-button.component';

describe('ThemeButtonComponent', () => {
  let component: ThemeButtonComponent;
  let fixture: ComponentFixture<ThemeButtonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ThemeButtonComponent]
    });
    fixture = TestBed.createComponent(ThemeButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
