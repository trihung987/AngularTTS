import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventsPaginationComponent } from './events-pagination.component';

describe('EventsPaginationComponent', () => {
  let component: EventsPaginationComponent;
  let fixture: ComponentFixture<EventsPaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventsPaginationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventsPaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
