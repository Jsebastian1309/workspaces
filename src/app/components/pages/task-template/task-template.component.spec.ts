import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskTemplateComponent } from './task-template.component';

describe('TaskTemplateComponent', () => {
  let component: TaskTemplateComponent;
  let fixture: ComponentFixture<TaskTemplateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TaskTemplateComponent]
    });
    fixture = TestBed.createComponent(TaskTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
