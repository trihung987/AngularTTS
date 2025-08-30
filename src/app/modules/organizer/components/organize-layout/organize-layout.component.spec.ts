import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizeLayoutComponent } from './organize-layout.component';

describe('OrganizeLayoutComponent', () => {
  let component: OrganizeLayoutComponent;
  let fixture: ComponentFixture<OrganizeLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizeLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizeLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
