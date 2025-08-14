import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateListComponent } from './create-list.component';

describe('CreateListComponent', () => {
  let component: CreateListComponent;
  let fixture: ComponentFixture<CreateListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreateListComponent]
    });
    fixture = TestBed.createComponent(CreateListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
