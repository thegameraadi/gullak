/**
 * @param {{currentVersion: string, fetchVersion: () => Promise<string>, canReload: () => boolean, reload: () => void}} options
 */
export function createReleaseUpdater({ currentVersion, fetchVersion, canReload, reload }) {
  let pending = false;
  let checking = false;
  let disposed = false;
  let reloaded = false;

  const apply = () => {
    if (!disposed && !reloaded && pending && canReload()) {
      reloaded = true;
      reload();
    }
  };

  const check = async () => {
    if (disposed || reloaded || checking) return;
    checking = true;
    try {
      const version = await fetchVersion();
      // A failed deployment, redirect, or malformed response never triggers a reload.
      if (/^[a-f0-9]{24}$/.test(version)) pending = version !== currentVersion;
      apply();
    } catch {
      // Keep the current app usable when connectivity returns or the server is busy.
    } finally {
      checking = false;
    }
  };

  return { check, apply, dispose: () => { disposed = true; } };
}
