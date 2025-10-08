import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventValidateComponent } from './event-validate.component';

describe('EventValidateComponent', () => {
  let component: EventValidateComponent;
  let fixture: ComponentFixture<EventValidateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventValidateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventValidateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
