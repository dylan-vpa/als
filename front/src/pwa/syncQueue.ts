type QueueItem = {
  path: string;
  method: string;
  body?: any;
  createdAt: number;
};

const DB_NAME = "als-sync-db";
const STORE_NAME = "postQueue";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "createdAt" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueue(item: Omit<QueueItem, "createdAt">) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ ...item, createdAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listAll(): Promise<QueueItem[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as QueueItem[]);
    req.onerror = () => reject(req.error);
  });
}

export async function remove(createdAt: number) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(createdAt);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function drain(processor: (item: QueueItem) => Promise<void>) {
  const items = await listAll();
  for (const item of items.sort((a, b) => a.createdAt - b.createdAt)) {
    try {
      await processor(item);
      await remove(item.createdAt);
    } catch (e) {
      // si falla, dejamos en cola
      break;
    }
  }
}