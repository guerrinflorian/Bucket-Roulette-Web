const DEFAULT_SKIN = {
  color_hex: '#111111',
  metalness: 0.3,
  roughness: 0.7
};

const parseNumber = (value, fallback) => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const normalizeWeaponSkin = (skin = {}) => ({
  color_hex: skin.color_hex || DEFAULT_SKIN.color_hex,
  metalness: parseNumber(skin.metalness, DEFAULT_SKIN.metalness),
  roughness: parseNumber(skin.roughness, DEFAULT_SKIN.roughness)
});

export const applyWeaponSkin = (scene, skin) => {
  if (!scene) return;
  const resolved = normalizeWeaponSkin(skin);
  let materialCount = 0;
  scene.traverse((child) => {
    if (!child.isMesh) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (!material) return;
      materialCount += 1;
      if (material.color?.set) {
        material.color.set(resolved.color_hex);
      }
      if (typeof material.metalness === 'number') {
        material.metalness = resolved.metalness;
      }
      if (typeof material.roughness === 'number') {
        material.roughness = resolved.roughness;
      }
      material.needsUpdate = true;
    });
  });
  console.log('[weaponSkins] applied', {
    color: resolved.color_hex,
    metalness: resolved.metalness,
    roughness: resolved.roughness,
    materialCount
  });
};
