import { AppState } from "../types";

const DB_NAME = 'LifeTrackerGhostSync';
const STORE_NAME = 'FileHandles';

// IndexedDB wrappers
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e: any) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
  });
}

let memoryHandle: FileSystemFileHandle | null = null;

export async function saveFileHandle(handle: FileSystemFileHandle) {
  memoryHandle = handle;
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(handle, 'master_handle');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getFileHandle(): Promise<FileSystemFileHandle | null> {
  if (memoryHandle) return memoryHandle;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get('master_handle');
    req.onsuccess = () => {
      memoryHandle = req.result || null;
      resolve(memoryHandle);
    };
    req.onerror = () => reject(req.error);
  });
}

// Ensure the handle is loaded at startup
getFileHandle().catch(() => {});


// Ensure permission
export async function verifyPermission(handle: FileSystemFileHandle, readWrite = true) {
  const options: any = {};
  if (readWrite) {
    options.mode = 'readwrite';
  }
  
  if (await (handle as any).queryPermission(options) === 'granted') {
    return true;
  }
  
  if (await (handle as any).requestPermission(options) === 'granted') {
    return true;
  }
  
  return false;
}

export async function ghostSyncWrite(data: AppState) {
  try {
    const handle = await getFileHandle();
    if (!handle) return false;
    
    const permitted = await verifyPermission(handle, true);
    if (!permitted) return false;
    
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    return true;
  } catch (e) {
    console.error("Ghost Sync Write Error:", e);
    return false;
  }
}

export async function ghostSyncRead(): Promise<AppState | null> {
  try {
    const handle = await getFileHandle();
    if (!handle) return null;
    
    // Just ensure read permission
    const permitted = await verifyPermission(handle, false);
    if (!permitted) return null;
    
    const file = await handle.getFile();
    const text = await file.text();
    return JSON.parse(text);
  } catch (e) {
    console.error("Ghost Sync Read Error:", e);
    return null;
  }
}

export async function linkGhostSyncFile() {
  try {
    const [handle] = await (window as any).showOpenFilePicker({
      types: [{
        description: 'JSON Files',
        accept: {'application/json': ['.json']}
      }]
    });
    await saveFileHandle(handle);
    return true;
  } catch (e) {
    console.error("Ghost Sync link failed:", e);
    return false;
  }
}

export async function createGhostSyncFile() {
  try {
    const handle = await (window as any).showSaveFilePicker({
      suggestedName: 'life_tracker_master.json',
      types: [{
        description: 'JSON Files',
        accept: {'application/json': ['.json']}
      }]
    });
    await saveFileHandle(handle);
    return true;
  } catch (e) {
    console.error("Ghost Sync create failed:", e);
    return false;
  }
}
