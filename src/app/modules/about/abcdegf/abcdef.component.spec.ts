import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbcdefComponent } from './abcdef.component';

describe('AbcdefComponent', () => {
  let component: AbcdefComponent;
  let fixture: ComponentFixture<AbcdefComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AbcdefComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AbcdefComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
