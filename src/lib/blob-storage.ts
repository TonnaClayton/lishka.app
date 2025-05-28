import { put } from "@vercel/blob";

const STORE_ID = "store_gHeP9tKUZzpsMcZW";
const STORE_URL = "https://ghep9tkuzzpsmczw.public.blob.vercel-storage.com";

export async function uploadImage(file: File) {
  if (!import.meta.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  }

  const blob = await put(file.name, file, {
    access: "public",
    token: import.meta.env.BLOB_READ_WRITE_TOKEN,
  });

  return blob.url;
}

export async function getBlobImage(name: string): Promise<string | null> {
  try {
    // Remove all spaces and special characters, convert to lowercase
    const cleanName = name.toLowerCase().replace(/[^a-z]/g, "");
    const url = `${STORE_URL}/${cleanName}.png`;
    const response = await fetch(url, { method: "HEAD" });
    return response.ok ? url : null;
  } catch (error) {
    console.error("Error checking blob image:", error);
    return null;
  }
}
