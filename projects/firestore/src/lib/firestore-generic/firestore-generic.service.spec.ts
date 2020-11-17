import { TestBed } from '@angular/core/testing';

import { FirestoreGenericService } from './firestore-generic.service';

describe('FirestoreGenericService', () => {
  let service: FirestoreGenericService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FirestoreGenericService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
