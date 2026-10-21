// Disposes geometries, skeletons, materials and the textures they reference
// for every node under `root`. Does not remove `root` from its parent.
export function disposeObject(root) {
  root.traverse((node) => {
    node.geometry?.dispose();
    node.skeleton?.dispose();

    const material = node.material;
    if (!material) return;

    const materials = Array.isArray(material) ? material : [material];
    for (const mat of materials) {
      for (const key in mat) {
        const value = mat[key];
        if (value && value.isTexture) value.dispose();
      }
      mat.dispose();
    }
  });
}
