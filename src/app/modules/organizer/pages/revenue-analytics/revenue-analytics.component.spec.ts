import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevenueAnalyticsComponent } from './revenue-analytics.component';

describe('RevenueAnalyticsComponent', () => {
  let component: RevenueAnalyticsComponent;
  let fixture: ComponentFixture<RevenueAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevenueAnalyticsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RevenueAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
