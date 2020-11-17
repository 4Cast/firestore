
import { Optional } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { from, of } from 'rxjs';
import { FirestoreExtrasService } from './firestore-extras.service';
import * as firebase from 'firebase';
import * as admin from 'firebase-admin';
import * as functions from 'firebase/functions';
import { AngularFirestoreCollection } from '@angular/fire/firestore';


export interface ISequenceNumber {
  number: number;
}

/**
 *
 *
 *
 */

export abstract class FirestoreService<T> {

public debug = false;
public collection: AngularFirestoreCollection<T>;
public collectionName: string;
public adjustmentType: AdjustType; // we only need this for reallocations and variations.
private afs = this.fes.afs;
public itemDoc: any;
public componentName = 'FIRESTORE SERVICE';
public color = 'DarkViolet';
public set id(value: string) {
  this._id = value;
}

public get id(): string {

  return this._id;
}

// tslint:disable-next-line: variable-name
private _id: string;


  constructor(
    @Optional() public fes: FirestoreExtrasService) {

    }

//   getTenants(){
//     const path = 'tenants';
//     return this.fes.afs.collection<any>(path, ref => ref.orderBy('name'))
//     .valueChanges();
//   }




  getList(collectionName: string, orderBy?: string, filter?: any, getFromRoot?: boolean): Observable<T[]> {
    let path = '';

    path = collectionName;

    // we were getting an error using 'ref' below
    // I don't think we are going to be using the firestore package anyway
    // we are just putting it here so everything compiles


    // function reference(ref: admin.firestore.CollectionReference) {

    //   let query: admin.firestore.Query = ref;

    //   if (orderBy) {
    //     query = query.orderBy(orderBy);
    //   }
    //   if (filter) {
    //     query.where(filter.property, '==', filter.value);
    //   }
    //   return query;
    // }



    return this.fes.afs.collection<T>(path)
    .valueChanges();
    // const returnValue = this.fes.afs.collection<T>(path, ref => reference(ref))
    //     .valueChanges();
    // return returnValue;

    }


    /**
     *
     * @param collectionName : string
     * @param field : string
     * @param value : string
     *
     * Used to search a collection for documents where field "starts with"
     * Firestore doesn't have a native "starts with" query
     * So we need to query for documents where field starts with the
     * string provided but less than field starts with next alpha character
     *
     * Example:
     * Query for starts with 'abc' will find documents where the field
     * starts with 'abc' but will not find documents where the field
     * starts with 'abd' or any later combination
     */
searchCollection(collectionName: string, field: string, value: string): Observable<any> {

  const path = collectionName; // assume collection is at root level now.
  const successor = this.prefixSuccessor(value);

  if (value && successor ) {
  return this.fes.afs.collection<T>(path, ref => ref
        .orderBy(field)
        .where(field, '>=', value)
        .where(field, '<', successor))
        .valueChanges();
  } else { return of(null); }

}

searchCollectionByField(collectionName: string, field: string, value: string, orderBy?: string): Observable<any> {

  const path = collectionName; // assume collection is at root level now.


  if (value) {
  return this.fes.afs.collection<T>(path, ref => ref
        .orderBy(field)
        .where(field, '>=', value))
        .valueChanges();
  } else { return of(null); }

}

/**
 * prefixSuccessor
 * @param prefix – string for which to find successor
 * @returns successor - successor to prefix
 *
 * Used for creating 'startsWith' queries.
 * For example if a user searches for FRA we want to be
 * query for all values starting with 'FRA'
 *
 * With Firestore the only way to do this is to search for values >= 'FRA' but < 'FRB'
 * In this case, 'FRB' is called the successor to 'FRA'.
 *
 * This function provides the successor.
 */
prefixSuccessor(prefix: string): string {
  // We can increment the last character in the string and be done
  // unless that character is 255 (0xff), in which case we have to erase the
  // last character and increment the previous character, unless that
  // is 255, etc. If the string is empty or consists entirely of
  // 255's, we just return the empty string.

  let successor = prefix;
  let index = prefix.length - 1;

  const last = prefix[index];

  while ( last === '\xff' && index >= 0) {
    index --;
  }

  if (index < 0) {
    successor = null;
  } else {
    const length = index + 1;
    successor = prefix.slice(0, length);
    const lastCode = successor.charCodeAt(index);
    const next = String.fromCharCode(lastCode + 1);
    successor = successor.slice(0, index-- ) + next;
  }

  return successor;
}

/**
 *
 * @param className : string
 *
 * TODO: we need to develop a function for getting project sequence number
 * that does not rely on tenant
 */
getProjectSequenceNumber(className): object {

  // can't get a proper reference to httpsCallable.
  // it keeps complaining about firebase.functions
  // just disable this method for the moment.

  // const getProjectSeqNo = firebase.functions.httpsCallable('getProjectSequenceNumber');
  // const projectId =  this.fes.projectId;
  // return getProjectSeqNo({tenantId: this.fes.tenantId, projectId, seqNoName: className});
  return {};

}

onFulfilled(value): void {

}

/**
 *
 * @param collectionName: string
 * @param idFieldName: string
 * @param parentId: string
 * @param orderBy: string
 *
 * DO NOT USE
 * This function uses collectionName which includes TenantID which we no longer use
 */
getListForParent(collectionName: string, idFieldName: string, parentId: string, orderBy: string): Observable<T[]> {
  const path = this.fes.collectionBase + this.projectCollectionName(collectionName);

  /**
   * Save collection so we can add a document to it later if we want.,
   */
  this.collection = this.fes.afs.collection<T>(path, ref => ref
       .where(idFieldName, '==', parentId));

  return this.collection
        .valueChanges();
}

  /**
   * @param collectionName: string name of collection
   * @param id: string
   *
   * @returns single document from collection
   */

  getDocument(collectionName: string, id: string): Observable<T> {
    console.log(`${this.componentName}, get document, collection name`, collectionName);
    const doc = this.getExisting(id, collectionName);
    console.log(`${this.componentName} (extending firestore service), document`, doc);
    return doc;
  }

  private getExisting(id: string, collectionName: string): Observable<T> {
    const path = this.fes.collectionBase + collectionName + '/' + id ;
    console.log(`${this.componentName}, get existing, path`, path);
    const afs = this.fes.afs;
    this.itemDoc = this.afs.doc<T>( path ).valueChanges();
    return this.itemDoc;
}

getProjectList(collectionName: string, orderBy: string): Observable<T[]> {

  const projectCollectionName = `projects/${this.fes.projectId}/${collectionName}`;
  return this.getList(projectCollectionName, orderBy);
}

getProjectDocumentFromRoute(route: ActivatedRoute): void {
  // console.log(`%c${this.componentName}, getProjectDocumentFromRoute route`, `color: ${this.color}`, route)
  // return route.paramMap.pipe(
  //   switchMap((params: ParamMap) => {
  //     const id: string = params.get('id');
  //     console.log(`%cFIRESTORE SERVICE, getProjectDocumentFromRoute id`, `color: ${this.color}`, id);
  //     let document: Observable<T> = null;
  //     if (id) {
  //       console.log(`%c${this.componentName}, get project document from route, collection name`,
  //                   `color: ${this.color}`, this.collectionName);
  //       console.log(`%c${this.componentName}, get project document from route, id`, `color: ${this.color}`, id);

  //       document =  this.getProjectDocument(this.collectionName, id);
  //     } else {
  //       document = this.newProjectDocument();
  //     }

  //     return document;
  //  })
  // );
}

  getProjectDocument(collectionName: string, id: string): Observable<T> {
    return this.getDocument(this.projectCollectionName(collectionName), id);
  }

  projectCollectionName(collectionName: string): string {
    return `projects/${this.fes.projectId}/${collectionName}`;
  }

  newProjectDocument(): Observable<T> {
    this.itemDoc = null; // itemDoc exists on super
    const document: T = null;
    const newDocument = this.addProjectDocument(null);
      // .then(res => {
      //   // we just need to return a null value of type T;
      //   return document;
      // })

    // Convert the promise into an Observable so it returns the
    // same type as 'getAdjustment.

    const returnValue = from (newDocument); // convert promise to observable
    return returnValue;

  }

  addProjectDocument(documentData: T, collectionPath?: string): Promise<T> {
    let projectCollectionName = this.projectCollectionName(this.collectionName);
    projectCollectionName = collectionPath ? projectCollectionName + collectionPath : projectCollectionName;
    const path = this.fes.collectionBase + projectCollectionName;
    const collection = this.afs.collection<T>(path);
    return collection.add(Object.assign({}, documentData))
    .then(res => {
      return res.get()
      .then(documentRes => {
        this.id = documentRes.id;
        const unknown = {id: this.id} as unknown;
        const newDocument = unknown as T;
        return newDocument;
      });
    });

  }

  deleteProjectDocument(documentId: string): Promise<void> {
    const projectCollectionName = this.projectCollectionName(this.collectionName) + '/' + documentId;
    const path = this.fes.collectionBase + projectCollectionName;
    const document = this.afs.doc(path);
    return document.delete();

  }

  updateProjectDocument(data: T): Promise<void> {
    // if(data['isNew']){
    //   return this.addProjectDocument(data)
    // } else {
    let id: string = null;
    if ( data.hasOwnProperty('id')) {
      // tslint:disable-next-line: no-string-literal
      id = data['id'];
    } else {
      id = this.id;
    }

    const projectCollectionName = this.projectCollectionName(this.collectionName) + '/' + id;
    const path = this.fes.collectionBase + projectCollectionName;
    const document = this.fes.afs.doc<T>(path);
    return document.update(Object.assign({}, data));
  // }


}



// private firestorePath(collectionName: string, getFromRoot?: boolean) {
//   if (getFromRoot) {
//     return collectionName;
//   } else {
//     return this.fes.collectionBase + collectionName;
//   }
// }

  goToRedirect(): void {
    // this.fes.router.navigate([this.redirectUrl])
  }
}

export type AdjustType = 'reallocation' | 'variation';
