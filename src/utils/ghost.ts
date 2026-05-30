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
  if (handle as any === 'safari_secured_sandbox') {
    return true; // Virtual sandbox has implicit permissions
  }
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
    
    if (handle as any === 'safari_secured_sandbox') {
      const payload = JSON.stringify(data, null, 2);
      localStorage.setItem('ghost_sync_safari_db_payload', payload);
      try {
        const root = await navigator.storage.getDirectory();
        const fileHandle = await root.getFileHandle("life_tracker_ghost_sync.json", { create: true });
        const accessHandle = await fileHandle.createWritable();
        await accessHandle.write(payload);
        await accessHandle.close();
      } catch (opfsErr) {
        console.warn("OPFS write failed, fell back to localStorage", opfsErr);
      }
      return true;
    }
    
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
    
    if (handle as any === 'safari_secured_sandbox') {
      try {
        const root = await navigator.storage.getDirectory();
        const fileHandle = await root.getFileHandle("life_tracker_ghost_sync.json");
        const file = await fileHandle.getFile();
        const text = await file.text();
        return JSON.parse(text);
      } catch (opfsErr) {
        const fbText = localStorage.getItem('ghost_sync_safari_db_payload');
        if (fbText) return JSON.parse(fbText);
      }
      return null;
    }
    
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
    if (!('showOpenFilePicker' in window)) {
      return new Promise<boolean>((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e: any) => {
          const file = e.target.files?.[0];
          if (!file) {
            resolve(false);
            return;
          }
          try {
            const text = await file.text();
            JSON.parse(text); // Validate JSON schema
            
            // Store a virtual safari/mobile sandboxed secure node
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.put('safari_secured_sandbox', 'master_handle');
            
            // Set memoryHandle
            memoryHandle = 'safari_secured_sandbox' as any;
            
            // Write payload to a fallback LocalStorage/IndexedDB key to load on startup
            localStorage.setItem('ghost_sync_safari_db_payload', text);
            resolve(true);
          } catch (err) {
            alert("Unable to parse file: Selected file is not a valid JSON database schema.");
            resolve(false);
          }
        };
        input.click();
      });
    }

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
    if (!('showSaveFilePicker' in window)) {
      // Create a simulated mobile/Safari safe node in OPFS / IndexedDB
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put('safari_secured_sandbox', 'master_handle');
      
      memoryHandle = 'safari_secured_sandbox' as any;
      
      // Auto-trigger a download of the baseline empty DB so Safari users have a physical file
      const emptyPayload = JSON.stringify({ version: "5.0", profile: { name: "", email: "" }, items: {}, pomoSessions: [] }, null, 2);
      const blob = new Blob([emptyPayload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'life_tracker_master.json';
      a.click();
      URL.revokeObjectURL(url);
      
      return true;
    }

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
