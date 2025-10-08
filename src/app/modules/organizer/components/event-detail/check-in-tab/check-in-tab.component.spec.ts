import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckInTabComponent } from './check-in-tab.component';

describe('CheckInTabComponent', () => {
  let component: CheckInTabComponent;
  let fixture: ComponentFixture<CheckInTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckInTabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckInTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
