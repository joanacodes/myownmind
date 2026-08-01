/**
 * Shrink a photo before upload. A modern phone camera produces 3–5 MB files;
 * at 2000px and JPEG q0.82 the same shot lands around 250–400 KB with no
 * visible loss at the sizes this app displays. That is the difference between
 * ~250 images and ~3000 in Supabase's free 1 GB.
 *
 * Falls back to the original file if anything goes wrong — an unresized
 * upload is much better than a failed one.
 */
export async function resizeImage(file: File, maxEdge = 2000): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));

    // Already small enough, and re-encoding would only lose quality.
    if (scale === 1 && file.size < 1_000_000) {
      bitmap.close();
      return file;
    }

    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82)
    );
    return blob ?? file;
  } catch {
    return file;
  }
}
