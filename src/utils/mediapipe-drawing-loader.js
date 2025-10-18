/**
 * Loads @mediapipe/drawing_utils and FaceMesh connections via CDN.
 * Exposes UMD globals on window:
 *   window.drawConnectors, window.drawLandmarks, window.FACEMESH_TESSELATION
 */
export function loadDrawingUtils() {
  if (typeof window !== 'undefined'
      && window.drawConnectors && window.drawLandmarks && window.FACEMESH_TESSELATION) {
    return Promise.resolve(true);
  }
  return new Promise((resolve, reject) => {
    const ensureGlobals = (t0=Date.now()) => {
      if (window.drawConnectors && window.drawLandmarks && window.FACEMESH_TESSELATION) return resolve(true);
      if (Date.now() - t0 > 8000) return reject(new Error('drawing_utils globals not found'));
      setTimeout(() => ensureGlobals(t0), 50);
    };
    const addScript = (id, src, onload) => {
      if (document.getElementById(id)) return onload();
      const s = document.createElement('script');
      s.id = id; s.async = true; s.src = src;
      s.onload = onload; s.onerror = () => reject(new Error(`failed to load ${src}`));
      document.head.appendChild(s);
    };
    addScript('mp-drawing-utils',
      'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
      () => addScript('mp-facemesh-connections',
        'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh_connections.js',
        () => ensureGlobals())
    );
  });
}
