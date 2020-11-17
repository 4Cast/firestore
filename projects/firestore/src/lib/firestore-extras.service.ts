import { Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { AngularFirestore } from '@angular/fire/firestore';


export interface ITenant {
  id: string;
  name: string;
}


/**
 * ==========================================================
 * FIRESTORE EXTRAS SERVICE
 * ==========================================================
 */

@Injectable({
  providedIn: 'root'
})
export class FirestoreExtrasService {

  private debugFes = false;
  private clientId: string;
  private componentName = 'FIRESTORE SERVICE';

  private localCollectionBase: string;
  private localTenantId: string;
  private localTenant: ITenant;

  public get tenant(): ITenant {
    return this.localTenant;
  }

  public set tenant(value: ITenant) {
    this.localTenant = value;
    if (this.localTenant) {
      this.tenantId = this.localTenant.id;
    } else {
      // post an error
    }
  }

  public set tenantId(value: string) {

    if (this.debugFes) {console.log('%cFIRESTORE SERVICE setting tenant Id', 'color:green', value); }

    this.localTenantId = value;
    this.collectionBase = 'tenants/' + this.localTenantId + '/';
  }

  public get tenantId(): string {

    if (this.debugFes) {
      console.log('FIRESTORE SERVICE, getting tenant id', this.localTenantId);
    }

    return this.localTenantId;
  }


  public get collectionBase(): string {

    if (this.debugFes) {console.log('%cFIRESTORE SERVICE getting collection base', 'color:blue', this.localCollectionBase); }

    return this.localCollectionBase;
  }

  public set collectionBase(value: string) {

    if (this.debugFes) {console.log('%cFIRESTORE SERVICE setting collection base', 'color:purple', value); }

    this.localCollectionBase = value;
  }

  private internalProjectId: string;

  public set projectId( value: string) {
    this.internalProjectId = value;
  }

  public get projectId(): string {
    return this.internalProjectId;
  }

  public redirectUrl: string;

  constructor(
    public afs: AngularFirestore,
    public router: Router,
    public route: ActivatedRoute
    // public auth: AuthService
    ) {}
}
