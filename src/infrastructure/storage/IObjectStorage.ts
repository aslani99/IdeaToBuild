/**
 * Storage abstraction so the object-storage provider (currently Cloudflare
 * R2, see docs/DECISIONS.md AD-004) can be swapped later without touching
 * application/domain code.
 */
export interface IObjectStorage {
  upload(key: string, data: Blob | ArrayBuffer, contentType: string): Promise<{ key: string; etag: string }>;
  download(key: string): Promise<Blob>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
}
