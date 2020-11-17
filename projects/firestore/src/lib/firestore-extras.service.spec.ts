import { TestBed } from '@angular/core/testing';

import { FirestoreExtrasService } from './firestore-extras.service';

describe('FirestoreExtrasService', () => {
  let service: FirestoreExtrasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FirestoreExtrasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
