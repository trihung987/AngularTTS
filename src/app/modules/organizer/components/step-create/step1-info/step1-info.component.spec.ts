import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Step1InfoComponent } from './step1-info.component';

describe('Step1InfoComponent', () => {
  let component: Step1InfoComponent;
  let fixture: ComponentFixture<Step1InfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Step1InfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Step1InfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
