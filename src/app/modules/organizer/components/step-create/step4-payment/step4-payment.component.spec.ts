import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Step4PaymentComponent } from './step4-payment.component';

describe('Step4PaymentComponent', () => {
  let component: Step4PaymentComponent;
  let fixture: ComponentFixture<Step4PaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Step4PaymentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Step4PaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
