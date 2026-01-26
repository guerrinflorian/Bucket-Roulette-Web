<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card class="weapon-skins-card">
      <q-card-section class="weapon-skins-header">
        <div>
          <div class="weapon-skins-title">Mon arme</div>
          <div class="weapon-skins-subtitle">Choisissez votre finition</div>
        </div>
        <div class="weapon-skins-coins">
          <q-icon name="paid" size="20px" color="amber-4" />
          <span>{{ coinsDisplay }} pièces</span>
        </div>
      </q-card-section>

      <q-separator dark />

      <q-card-section class="weapon-skins-content">
        <q-banner v-if="errorMessage" rounded class="weapon-skins-error">
          <template v-slot:avatar>
            <q-icon name="error" color="red-4" />
          </template>
          {{ errorMessage }}
        </q-banner>

        <div v-if="isLoading" class="weapon-skins-loading">Chargement des skins...</div>

        <div v-else class="weapon-skins-grid">
          <div
            v-for="skin in skins"
            :key="skin.key"
            class="weapon-skin-card"
            :class="{ equipped: skin.isEquipped }"
          >
            <div class="weapon-skin-main">
              <div class="weapon-skin-swatch" :style="{ backgroundColor: skin.color_hex }"></div>
              <div>
                <div class="weapon-skin-name">{{ skin.name }}</div>
                <div class="weapon-skin-meta">
                  <span>{{ skin.priceLabel }}</span>
                  <span class="weapon-skin-dot">•</span>
                  <span>Metal {{ skin.metalnessLabel }}</span>
                  <span class="weapon-skin-dot">•</span>
                  <span>Rough {{ skin.roughnessLabel }}</span>
                </div>
              </div>
            </div>

            <div class="weapon-skin-actions">
              <q-btn
                v-if="skin.isEquipped"
                label="Équipé"
                color="positive"
                unelevated
                disable
              />
              <q-btn
                v-else
                :label="skin.actionLabel"
                :color="skin.isOwned ? 'amber-7' : 'deep-orange-6'"
                unelevated
                :disable="skin.actionDisabled"
                @click="handleAction(skin)"
              />
            </div>
          </div>
        </div>
      </q-card-section>

      <q-separator dark />

      <q-card-actions align="right" class="weapon-skins-actions">
        <q-btn flat label="Fermer" color="grey-4" @click="close" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { Notify } from 'quasar';
import { useWeaponSkinsStore } from '../stores/weaponSkinsStore.js';
import { useAuthStore } from '../stores/authStore.js';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

const weaponSkinsStore = useWeaponSkinsStore();
const authStore = useAuthStore();
const isLoading = ref(false);
const errorMessage = ref('');

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const coinsDisplay = computed(() => weaponSkinsStore.coins ?? 0);

const skins = computed(() => {
  const owned = new Set(weaponSkinsStore.ownedSkinIds || []);
  const equippedId = weaponSkinsStore.equippedSkinId ?? null;
  const defaultSkin = weaponSkinsStore.defaultSkin;

  const list = [
    {
      key: 'default',
      id: null,
      name: defaultSkin.name,
      price_coins: 0,
      color_hex: defaultSkin.color_hex,
      metalness: defaultSkin.metalness,
      roughness: defaultSkin.roughness,
      isOwned: true,
      isEquipped: equippedId === null,
      actionLabel: 'Équiper',
      priceLabel: 'Gratuit'
    },
    ...weaponSkinsStore.catalog.map((skin) => ({
      key: skin.id,
      id: skin.id,
      name: skin.name,
      price_coins: Number(skin.price_coins ?? 0),
      color_hex: skin.color_hex,
      metalness: skin.metalness,
      roughness: skin.roughness,
      isOwned: owned.has(skin.id),
      isEquipped: equippedId === skin.id,
      actionLabel: owned.has(skin.id) ? 'Équiper' : 'Acheter',
      priceLabel: `${skin.price_coins ?? 0} pièces`
    }))
  ];

  return list.map((skin) => ({
    ...skin,
    actionDisabled: !skin.isOwned && weaponSkinsStore.coins < skin.price_coins,
    metalnessLabel: Number.isFinite(Number(skin.metalness))
      ? Number(skin.metalness).toFixed(2)
      : '0.30',
    roughnessLabel: Number.isFinite(Number(skin.roughness))
      ? Number(skin.roughness).toFixed(2)
      : '0.70'
  }));
});

const loadData = async () => {
  if (!authStore.isAuthenticated) return;
  isLoading.value = true;
  errorMessage.value = '';
  try {
    await Promise.all([
      weaponSkinsStore.fetchCatalog(),
      weaponSkinsStore.fetchMyInventory()
    ]);
  } catch (error) {
    errorMessage.value = error?.message || 'Impossible de charger la boutique.';
  } finally {
    isLoading.value = false;
  }
};

const handleAction = async (skin) => {
  if (!authStore.isAuthenticated) return;
  if (skin.isOwned) {
    try {
      await weaponSkinsStore.equipSkin(skin.id);
      await weaponSkinsStore.fetchMyInventory();
    } catch (error) {
      Notify.create({
        type: 'negative',
        message: error?.message || "Impossible d'équiper ce skin."
      });
    }
    return;
  }

  if (weaponSkinsStore.coins < skin.price_coins) {
    Notify.create({
      type: 'warning',
      message: 'Solde insuffisant pour acheter ce skin.'
    });
    return;
  }

  try {
    await weaponSkinsStore.buySkin(skin.id);
    await weaponSkinsStore.fetchMyInventory();
    Notify.create({ type: 'positive', message: 'Skin acheté !' });
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: error?.message || "Impossible d'acheter ce skin."
    });
  }
};

const close = () => {
  emit('update:modelValue', false);
};

watch(
  () => props.modelValue,
  (isOpenNow) => {
    if (!isOpenNow) return;
    loadData();
  }
);
</script>

<style scoped>
.weapon-skins-card {
  width: min(720px, 92vw);
  border-radius: 20px;
  background: linear-gradient(160deg, rgba(10, 13, 20, 0.98), rgba(15, 18, 28, 0.96));
  border: 1px solid rgba(251, 191, 36, 0.2);
  color: #f8fafc;
}

.weapon-skins-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.weapon-skins-title {
  font-size: 22px;
  font-weight: 800;
  color: #fef3c7;
}

.weapon-skins-subtitle {
  font-size: 13px;
  color: rgba(226, 232, 240, 0.65);
}

.weapon-skins-coins {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: #fcd34d;
  background: rgba(15, 23, 42, 0.6);
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.weapon-skins-content {
  max-height: 60vh;
  overflow-y: auto;
  padding: 20px;
}

.weapon-skins-grid {
  display: grid;
  gap: 16px;
}

.weapon-skin-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.6);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.weapon-skin-card.equipped {
  border-color: rgba(34, 197, 94, 0.4);
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.2);
}

.weapon-skin-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.35);
}

.weapon-skin-main {
  display: flex;
  align-items: center;
  gap: 16px;
}

.weapon-skin-swatch {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.6);
}

.weapon-skin-name {
  font-weight: 700;
  font-size: 16px;
  color: #f8fafc;
}

.weapon-skin-meta {
  font-size: 12px;
  color: rgba(226, 232, 240, 0.65);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.weapon-skin-dot {
  opacity: 0.6;
}

.weapon-skins-loading {
  text-align: center;
  padding: 30px 0;
  color: rgba(226, 232, 240, 0.7);
}

.weapon-skins-error {
  margin-bottom: 16px;
  background: rgba(127, 29, 29, 0.4);
  color: #fecaca;
}

.weapon-skins-actions {
  padding: 12px 18px 16px;
}

@media (max-width: 640px) {
  .weapon-skin-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .weapon-skin-actions {
    width: 100%;
  }

  .weapon-skin-actions :deep(.q-btn) {
    width: 100%;
  }
}
</style>
