/**
 * Thin wrapper around the Cloudflare R2 binding. Kept intentionally minimal:
 * sharebox only ever needs to put, get, head, and delete a single object per
 * call. The binding type comes from `@cloudflare/workers-types`.
 */

export interface PutFileInput {
  key: string;
  body: ReadableStream | ArrayBuffer | Uint8Array | Blob | string;
  contentType: string;
}

export async function putFile(
  bucket: R2Bucket,
  { key, body, contentType }: PutFileInput
): Promise<void> {
  await bucket.put(key, body, {
    httpMetadata: { contentType }
  });
}

export function getFile(bucket: R2Bucket, key: string): Promise<R2ObjectBody | null> {
  return bucket.get(key);
}

export function headFile(bucket: R2Bucket, key: string): Promise<R2Object | null> {
  return bucket.head(key);
}

export async function deleteFile(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key);
}
