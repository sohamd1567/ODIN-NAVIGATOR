import * as THREE from 'three';
import { useLayoutEffect } from 'react';

/**
 * Prevents incorrect CPU-side frustum culling on complex/animated or scaled hierarchies.
 * Default 'disable' will set frustumCulled=false on all descendants.
 * 'refresh' will recompute world matrices and bounding volumes after transforms.
 */
export function usePlanetCullingGuard(
  ref: React.RefObject<THREE.Object3D>,
  mode: 'disable' | 'refresh' = 'disable'
) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (mode === 'disable') {
      root.traverse((o: any) => {
        o.frustumCulled = false;
      });
    } else {
      root.updateMatrixWorld(true);
      root.traverse((o: any) => {
        if (o.geometry?.computeBoundingSphere) o.geometry.computeBoundingSphere();
        if (o.geometry?.computeBoundingBox) o.geometry.computeBoundingBox();
      });
    }
  }, [ref, mode]);
}
