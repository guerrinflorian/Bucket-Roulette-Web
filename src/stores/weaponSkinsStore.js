import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './authStore.js';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

const DEFAULT_SKIN = {
  id: null,
  name: 'Noir Classique',
  price_coins: 0,
  color_hex: '#111111',
  metalness: 0.3,
  roughness: 0.7
};

const normalizeSkin = (skin) => ({
  ...skin,
  metalness: Number.isFinite(Number.parseFloat(skin?.metalness))
    ? Number.parseFloat(skin.metalness)
    : DEFAULT_SKIN.metalness,
  roughness: Number.isFinite(Number.parseFloat(skin?.roughness))
    ? Number.parseFloat(skin.roughness)
    : DEFAULT_SKIN.roughness,
  color_hex: skin?.color_hex || DEFAULT_SKIN.color_hex
});

export const useWeaponSkinsStore = defineStore('weaponSkins', () => {
  const catalog = ref([]);
  const ownedSkinIds = ref([]);
  const equippedSkinId = ref(null);
  const coins = ref(0);
  const loading = ref(false);
  const error = ref('');
  const playerSkinsByUserId = ref({});

  const authHeaders = () => {
    const authStore = useAuthStore();
    return {
      'Content-Type': 'application/json',
      ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {})
    };
  };

  const request = async (path, options = {}) => {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...authHeaders(),
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Erreur serveur.');
    }
    return data;
  };

  const setError = (message) => {
    error.value = message || '';
  };

  const defaultSkin = computed(() => DEFAULT_SKIN);

  const skinById = computed(() => {
    const map = new Map(catalog.value.map((skin) => [skin.id, normalizeSkin(skin)]));
    return (id) => map.get(id) || null;
  });

  const resolveEquippedSkin = (skinId) => {
    if (!skinId) return normalizeSkin(DEFAULT_SKIN);
    const resolved = skinById.value(skinId);
    return normalizeSkin(resolved || DEFAULT_SKIN);
  };

  const setPlayerSkin = (userId, skinId) => {
    if (!userId) return;
    playerSkinsByUserId.value = {
      ...playerSkinsByUserId.value,
      [userId]: resolveEquippedSkin(skinId)
    };
  };

  const setPlayerSkinData = (userId, skin) => {
    if (!userId) return;
    playerSkinsByUserId.value = {
      ...playerSkinsByUserId.value,
      [userId]: normalizeSkin(skin || DEFAULT_SKIN)
    };
  };

  const fetchCatalog = async () => {
    loading.value = true;
    setError('');
    try {
      const data = await request('/api/weapon-skins');
      catalog.value = Array.isArray(data.skins) ? data.skins.map(normalizeSkin) : [];
      return catalog.value;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchMyInventory = async () => {
    loading.value = true;
    setError('');
    try {
      const data = await request('/api/weapon-skins/me');
      ownedSkinIds.value = Array.isArray(data.ownedSkinIds) ? data.ownedSkinIds : [];
      equippedSkinId.value = data.equippedSkinId ?? null;
      coins.value = Number.isFinite(Number(data.coins)) ? Number(data.coins) : 0;
      const authStore = useAuthStore();
      if (authStore.user?.id) {
        setPlayerSkin(authStore.user.id, equippedSkinId.value);
      }
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const buySkin = async (skinId) => {
    if (!skinId) return null;
    loading.value = true;
    setError('');
    try {
      const data = await request('/api/weapon-skins/buy', {
        method: 'POST',
        body: JSON.stringify({ skinId })
      });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const equipSkin = async (skinId) => {
    loading.value = true;
    setError('');
    try {
      const data = await request('/api/weapon-skins/equip', {
        method: 'POST',
        body: JSON.stringify({ skinId })
      });
      equippedSkinId.value = data.equippedSkinId ?? null;
      const authStore = useAuthStore();
      if (authStore.user?.id) {
        setPlayerSkin(authStore.user.id, equippedSkinId.value);
      }
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchPlayerSkin = async (userId, options = {}) => {
    if (!userId) return null;
    if (!options.force && playerSkinsByUserId.value[userId]) {
      return playerSkinsByUserId.value[userId];
    }
    try {
      const data = await request(`/api/weapon-skins/user/${userId}`);
      setPlayerSkinData(userId, data.skin);
      return data.skin;
    } catch (err) {
      setPlayerSkinData(userId, DEFAULT_SKIN);
      return DEFAULT_SKIN;
    }
  };

  const getSkinForUserId = (userId) => {
    if (!userId) return normalizeSkin(DEFAULT_SKIN);
    return normalizeSkin(playerSkinsByUserId.value[userId] || DEFAULT_SKIN);
  };

  return {
    catalog,
    ownedSkinIds,
    equippedSkinId,
    coins,
    loading,
    error,
    defaultSkin,
    playerSkinsByUserId,
    fetchCatalog,
    fetchMyInventory,
    buySkin,
    equipSkin,
    fetchPlayerSkin,
    setPlayerSkin,
    getSkinForUserId
  };
});
