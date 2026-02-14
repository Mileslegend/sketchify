
// Local minimal type declarations to satisfy TypeScript in this module.
// If ambient globals from type.d.ts are available, these local types will simply shadow them here.
export type RenderCompletePayload = {
  renderedImage: string;
  renderedPath?: string;
};

export interface Generate3DViewParams {
  // Accept the same shape used by callers (data URL string or URL string)
  sourceImage: string;
  projectId?: string | null;
}

export async function fetchAsDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }

  const blob = await response.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("Failed to read blob as Data URL"));
      }
    };

    reader.onerror = () => {
      reject(reader.error || new Error("FileReader encountered an error"));
    };

    reader.readAsDataURL(blob);
  });
}

export async function generate3DView({ sourceImage }: Generate3DViewParams): Promise<RenderCompletePayload> {
  // For now, this is a passthrough that ensures we have a data URL to render.
  // Later, this can call a real AI API using SKETCHIFY_RENDER_PROMPT, etc.
  try {
    const isDataUrl = typeof sourceImage === "string" && sourceImage.startsWith("data:");
    if (isDataUrl) {
      return { renderedImage: sourceImage };
    }
    const dataUrl = await fetchAsDataUrl(sourceImage);
    return { renderedImage: dataUrl };
  } catch (e) {
    // Re-throw to let callers surface the failure
    throw e instanceof Error ? e : new Error("Failed to generate 3D view");
  }
}