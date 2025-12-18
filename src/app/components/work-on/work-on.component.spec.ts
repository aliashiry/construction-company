import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkOnComponent } from './work-on.component';

describe('WorkOnComponent', () => {
  let component: WorkOnComponent;
  let fixture: ComponentFixture<WorkOnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkOnComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkOnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
