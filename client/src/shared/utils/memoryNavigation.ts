const MEMORY_LAST_PATH_KEY = 'memory_last_path';

export type MemoryRoute = '/memory/timeline' | '/memory/map';

export function getLastMemoryPath(): MemoryRoute {
  const stored = sessionStorage.getItem(MEMORY_LAST_PATH_KEY);
  if (stored === '/memory/map') {
    return '/memory/map';
  }
  return '/memory/timeline';
}

export function setLastMemoryPath(path: MemoryRoute): void {
  sessionStorage.setItem(MEMORY_LAST_PATH_KEY, path);
}
