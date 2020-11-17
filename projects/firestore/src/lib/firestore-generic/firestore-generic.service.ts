import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';




@Injectable({
  providedIn: 'root'
})
export class FirestoreGenericService {

  constructor(private afs: AngularFirestore ) { }

addByPath(collectionPath: string, data: any): Promise<void> {
  const collection = this.afs.collection(collectionPath);
  const id = data.id;
  return collection.doc(id).set(data); }

}
