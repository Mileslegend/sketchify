import puter from "@heyputer/puter.js";
import {getOrCreateHostingConfig, uploadImageToHosting} from "./puter.hosting";
import {isHostedUrl} from "./utils";

export const signIn = async () => await puter.auth.signIn();

export const signOut =  () =>  puter.auth.signOut();

export const getCurrentUser = async () => {
    try {
        return await puter.auth.getUser();
    } catch {
        return null;
    }

}

export const createProject = async ({ item }: CreateProjectParams): Promise<DesignItem | null> => {
    const projectId = item.id;

    // Try to provision hosting, but treat failures as non-fatal
    let hosting = null as Awaited<ReturnType<typeof getOrCreateHostingConfig>>;
    try {
        hosting = await getOrCreateHostingConfig();
    } catch {
        hosting = null;
    }

    // Attempt to upload images to hosting when possible
    const hostedSource = projectId
        ? await uploadImageToHosting({ hosting, url: item.sourceImage, projectId, label: 'source' })
        : null;

    const hostedRender = projectId && item.renderedImage
        ? await uploadImageToHosting({ hosting, url: item.renderedImage, projectId, label: 'rendered' })
        : null;

    // Resolve final URLs, gracefully falling back to the originals (including data URLs)
    const resolvedSource = hostedSource?.url
        || (isHostedUrl(item.sourceImage) ? item.sourceImage : item.sourceImage);

    if (!resolvedSource) {
        console.warn('Source image is missing; cannot create project payload.');
        return null;
    }

    const resolvedRender = hostedRender?.url
        || (item.renderedImage && isHostedUrl(item.renderedImage) ? item.renderedImage : item.renderedImage || undefined);

    const {
        sourcePath: _sourcePath,
        renderedPath: _renderedPath,
        publicPath: _publicPath,
        ...rest
    } = item;

    const payload: DesignItem = {
        ...rest,
        sourceImage: resolvedSource,
        renderedImage: resolvedRender ?? null,
        timestamp: item.timestamp ?? Date.now(),
    };

    // Best-effort: try to persist to Puter KV, but don't fail the flow if it errors
    try {
        // Namespaced key for the project; adjust as needed if a worker/API is introduced later
        // @ts-ignore - KV may not be available in all environments at dev-time
        await puter.kv.set?.(`project:${projectId}`, payload);
    } catch (e) {
        console.log('Warning: Failed to save project to KV (continuing anyway):', e);
    }

    return payload;
}