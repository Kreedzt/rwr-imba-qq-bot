import { fileURLToPath } from 'url';
import { dirname } from 'path';

/**
 * Get the directory name of the current module (ESM equivalent of __dirname)
 * @param importMetaUrl - import.meta.url from the calling module
 * @returns The directory path of the current module
 */
export function getDirname(importMetaUrl: string): string {
    const __filename = fileURLToPath(importMetaUrl);
    const __dirname = dirname(__filename);
    return __dirname;
}

