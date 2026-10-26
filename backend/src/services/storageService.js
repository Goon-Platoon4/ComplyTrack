function config() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_PRIVATE_BUCKET } =
    process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_PRIVATE_BUCKET)
    throw new Error("Private document storage is not configured");
  return {
    base: `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object`,
    key: SUPABASE_SERVICE_ROLE_KEY,
    bucket: SUPABASE_PRIVATE_BUCKET,
  };
}
async function storageRequest(path, options = {}) {
  const { base, key } = config();
  const response = await fetch(`${base}/${path}`, {
    ...options,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      ...(options.headers || {}),
    },
  });
  if (!response.ok)
    throw new Error(`Private storage request failed (${response.status})`);
  return response;
}
export async function uploadQuarantineObject(key, buffer, contentType) {
  const { bucket } = config();
  await storageRequest(
    `${encodeURIComponent(bucket)}/${key.split("/").map(encodeURIComponent).join("/")}`,
    {
      method: "POST",
      headers: {
        "content-type": contentType,
        "x-upsert": "false",
        "cache-control": "no-store",
      },
      body: buffer,
    },
  );
}
export async function moveQuarantineObject(sourceKey, destinationKey) {
  const { bucket } = config();
  await storageRequest("move", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ bucketId: bucket, sourceKey, destinationKey }),
  });
}
export async function removeStorageObject(key) {
  const { bucket } = config();
  await storageRequest(
    `${encodeURIComponent(bucket)}/${key.split("/").map(encodeURIComponent).join("/")}`,
    { method: "DELETE" },
  );
}
export async function createSignedDownloadUrl(key) {
  const { bucket, base, key: serviceKey } = config();
  const response = await fetch(
    `${base}/sign/${encodeURIComponent(bucket)}/${key.split("/").map(encodeURIComponent).join("/")}?expiresIn=60`,
    {
      method: "POST",
      headers: {
        apikey: serviceKey,
        authorization: `Bearer ${serviceKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ expiresIn: 60 }),
    },
  );
  if (!response.ok) throw new Error("Unable to create document download link");
  const data = await response.json();
  const signed = data.signedURL || data.signedUrl;
  if (!signed) throw new Error("Storage provider returned no signed URL");
  return signed.startsWith("http")
    ? signed
    : `${process.env.SUPABASE_URL.replace(/\/$/, "")}/storage/v1${signed}`;
}
