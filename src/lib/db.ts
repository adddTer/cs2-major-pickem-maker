import { openDB } from 'idb';
import { PickSet, MatrixSet } from '../types';

const DB_NAME = 'PickEmGenDB';
const STORE_NAME = 'PickSets';
const MATRIX_STORE = 'MatrixSets';

export async function initDB() {
  return openDB(DB_NAME, 2, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(MATRIX_STORE)) {
        const matrixStore = db.createObjectStore(MATRIX_STORE, { keyPath: 'id' });
        matrixStore.createIndex('stage', 'stage', { unique: false });
      }
    },
  });
}

export async function getAllPickSets(): Promise<PickSet[]> {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}

export async function getPickSet(id: string): Promise<PickSet | undefined> {
  const db = await initDB();
  return db.get(STORE_NAME, id);
}

export async function savePickSet(pickSet: PickSet): Promise<void> {
  const db = await initDB();
  await db.put(STORE_NAME, pickSet);
}

export async function deletePickSet(id: string): Promise<void> {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
}

export async function getAllMatrixSets(stage?: string, eventId?: string): Promise<MatrixSet[]> {
  const db = await initDB();
  let sets = await db.getAll(MATRIX_STORE);
  if (stage) {
    sets = sets.filter((s) => s.stage === stage);
  }
  sets = sets.filter((s) => s.eventId === eventId || (!s.eventId && eventId === 'iem_cologne_2026'));
  return sets;
}

export async function saveMatrixSet(matrixSet: MatrixSet): Promise<void> {
  const db = await initDB();
  await db.put(MATRIX_STORE, matrixSet);
}

export async function deleteMatrixSet(id: string): Promise<void> {
  const db = await initDB();
  await db.delete(MATRIX_STORE, id);
}
