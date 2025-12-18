import { TestBed } from '@angular/core/testing';

import { WorkOnService } from './work-on.service';

describe('WorkOnService', () => {
  let service: WorkOnService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkOnService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
