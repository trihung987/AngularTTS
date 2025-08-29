import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Step2TimeComponent } from './step2-time.component';

describe('Step2TimeComponent', () => {
  let component: Step2TimeComponent;
  let fixture: ComponentFixture<Step2TimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Step2TimeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Step2TimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
