import { TestBed } from '@angular/core/testing';

import { EventValidateService } from './event-validate.service';

describe('EventValidateService', () => {
  let service: EventValidateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventValidateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
