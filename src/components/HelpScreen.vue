<template>
  <q-page class="min-h-screen bg-black relative overflow-hidden">
    <!-- Animated Background -->
    <div class="absolute inset-0">
      <!-- Gradient Background -->
      <div class="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/20"></div>
      
      <!-- Grid Pattern -->
      <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] opacity-40"></div>
      
      <!-- Floating Bullets (like menu) -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-[15%] left-[10%] text-xl opacity-15 animate-float-bullet">🔴</div>
        <div class="absolute top-[25%] right-[15%] text-xl opacity-15 animate-float-bullet-delayed" style="animation-delay: -4s">⚪</div>
        <div class="absolute top-[60%] left-[5%] text-xl opacity-15 animate-float-bullet-delayed" style="animation-delay: -8s">🔴</div>
        <div class="absolute top-[70%] right-[8%] text-xl opacity-15 animate-float-bullet" style="animation-delay: -12s">⚪</div>
        <div class="absolute top-[85%] left-[50%] text-xl opacity-15 animate-float-bullet-delayed" style="animation-delay: -16s">🔴</div>
      </div>
    </div>

    <!-- Content -->
    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      
      <!-- Back Button with Style -->
      <q-btn
        flat
        icon="arrow_back"
        label="Retour au menu"
        class="mb-8 px-6 py-3 rounded-full border-2 border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-400 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all duration-300 font-semibold"
        @click="goBack"
      />

      <!-- Hero Section -->
      <div class="mb-16 lg:mb-20">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 mb-6 backdrop-blur-sm">
          <q-icon name="auto_awesome" class="text-amber-400 animate-pulse" />
          <span class="text-amber-300 font-bold text-sm tracking-widest uppercase">Guide du duel</span>
        </div>
        
        <h1 class="text-5xl sm:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 mb-6 leading-tight">
          Aide & règles du jeu
        </h1>
        
        <p class="text-xl sm:text-2xl text-slate-300/90 max-w-4xl leading-relaxed font-light">
          Pas besoin d'être un expert : voici les règles expliquées simplement, étape par étape,
          avec les cartes disponibles, les modes de jeu, et des astuces pour survivre. 💀
        </p>
      </div>

      <!-- Objectif & Principes -->
      <section class="mb-16 lg:mb-20">
        <div class="flex items-center gap-4 mb-8">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/50">
            <q-icon name="sports_martial_arts" size="28px" class="text-white" />
          </div>
          <h2 class="text-3xl sm:text-4xl font-black text-white">Objectif & principes</h2>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="group relative">
            <div class="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <q-card class="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border-2 border-amber-500/30 group-hover:border-amber-400 rounded-2xl transition-all duration-300 h-full">
              <q-card-section class="p-6">
                <div class="text-4xl mb-4">🎯</div>
                <h3 class="text-2xl font-bold text-amber-400 mb-4">Dernier survivant</h3>
                <p class="text-slate-300 leading-relaxed text-lg">
                  Vous commencez avec <span class="text-amber-400 font-bold text-xl">5 PV</span>. Chaque balle réelle retire des PV. 
                  Le dernier joueur debout remporte la manche.
                </p>
              </q-card-section>
            </q-card>
          </div>

          <div class="group relative">
            <div class="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <q-card class="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border-2 border-red-500/30 group-hover:border-red-400 rounded-2xl transition-all duration-300 h-full">
              <q-card-section class="p-6">
                <div class="text-4xl mb-4">🔫</div>
                <h3 class="text-2xl font-bold text-red-400 mb-4">Barillet aléatoire</h3>
                <p class="text-slate-300 leading-relaxed text-lg">
                  Le barillet contient <span class="text-red-400 font-bold text-xl">2 à 7</span> cartouches mélangées (réelles + blanches). 
                  Quand il est vide, il est rechargé et remixé.
                </p>
              </q-card-section>
            </q-card>
          </div>

          <div class="group relative">
            <div class="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <q-card class="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border-2 border-purple-500/30 group-hover:border-purple-400 rounded-2xl transition-all duration-300 h-full">
              <q-card-section class="p-6">
                <div class="text-4xl mb-4">🃏</div>
                <h3 class="text-2xl font-bold text-purple-400 mb-4">Cartes tactiques</h3>
                <p class="text-slate-300 leading-relaxed text-lg">
                  Après chaque rechargement, vous recevez <span class="text-purple-400 font-bold text-xl">1 carte</span>. 
                  Elles servent à manipuler le barillet ou votre adversaire.
                </p>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </section>

      <!-- Modes de jeu -->
      <section class="mb-16 lg:mb-20">
        <div class="flex items-center gap-4 mb-8">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-500/50">
            <q-icon name="sports_esports" size="28px" class="text-white" />
          </div>
          <h2 class="text-3xl sm:text-4xl font-black text-white">Modes de jeu</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div
            v-for="mode in modes"
            :key="mode.title"
            class="group relative"
          >
            <div :class="`absolute inset-0 ${mode.glow} rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500`"></div>
            <q-card class="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border-2 border-white/10 group-hover:border-white/30 rounded-2xl transition-all duration-300 h-full">
              <q-card-section class="p-6 flex flex-col gap-4">
                <div :class="`w-12 h-12 rounded-xl ${mode.iconBg} flex items-center justify-center shadow-lg ${mode.iconShadow}`">
                  <q-icon :name="mode.icon" size="26px" class="text-white" />
                </div>
                <div>
                  <h3 class="text-xl font-bold text-white mb-2">{{ mode.title }}</h3>
                  <p class="text-slate-300 leading-relaxed text-base">{{ mode.description }}</p>
                </div>
                <div class="mt-auto flex flex-wrap gap-2">
                  <q-chip
                    dense
                    :class="`${mode.tagBg} ${mode.tagText} border ${mode.tagBorder} font-bold px-3`"
                  >
                    {{ mode.tag }}
                  </q-chip>
                  <q-chip
                    dense
                    :class="`${mode.secondaryBg} ${mode.secondaryText} border ${mode.secondaryBorder} font-bold px-3`"
                  >
                    {{ mode.secondary }}
                  </q-chip>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </section>

      <!-- Pourquoi tirer sur soi -->
      <section class="mb-16 lg:mb-20">
        <div class="flex items-center gap-4 mb-8">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/50">
            <q-icon name="insights" size="28px" class="text-white" />
          </div>
          <h2 class="text-3xl sm:text-4xl font-black text-white">Pourquoi tirer sur soi ?</h2>
        </div>
        
        <div class="relative group">
          <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
          <q-card class="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-2 border-cyan-500/40 rounded-3xl overflow-hidden">
            <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl"></div>
            <q-card-section class="relative p-8 lg:p-10">
              <p class="text-slate-200 leading-relaxed text-xl mb-6">
                Tenter un tir sur vous-même peut paraître étrange, mais c'est un choix stratégique : 
                si la balle est blanche, <span class="text-cyan-400 font-bold text-2xl">vous ne perdez aucun PV</span> et 
                vous gagnez un nouveau tour. Cela permet d'enchaîner les actions, d'utiliser vos cartes, 
                ou de forcer l'adversaire à subir un barillet plus dangereux.
              </p>
              <div class="flex items-start gap-3 p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/30">
                <q-icon name="lightbulb" class="text-cyan-400 text-2xl mt-1" />
                <p class="text-cyan-200 italic text-lg">
                  En résumé : tirer sur soi est un pari pour conserver l'initiative quand vous pensez que 
                  la prochaine balle est blanche.
                </p>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </section>

      <!-- Progression & classement -->
      <section class="mb-16 lg:mb-20">
        <div class="flex items-center gap-4 mb-8">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/50">
            <q-icon name="emoji_events" size="28px" class="text-white" />
          </div>
          <h2 class="text-3xl sm:text-4xl font-black text-white">Progression & classement</h2>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="group relative">
            <div class="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <q-card class="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border-2 border-amber-500/30 group-hover:border-amber-400 rounded-2xl transition-all duration-300 h-full">
              <q-card-section class="p-6">
                <div class="text-4xl mb-4">🏆</div>
                <h3 class="text-2xl font-bold text-amber-400 mb-4">Matchs classés</h3>
                <p class="text-slate-300 leading-relaxed text-lg">
                  En classé 1v1, votre <span class="text-amber-400 font-bold">Elo</span> évolue à chaque duel.
                  Plus l'adversaire est fort, plus la victoire rapporte. Les ligues vont de
                  <span class="text-amber-300 font-bold">Condamné</span> à
                  <span class="text-amber-300 font-bold">Tsar de Sang</span>.
                </p>
                <div class="mt-5 flex items-start gap-3 p-4 bg-amber-500/10 rounded-xl border border-amber-500/30">
                  <q-icon name="timeline" class="text-amber-400 text-2xl mt-1" />
                  <p class="text-amber-100 text-base">
                    Consultez votre ligue dans l'onglet Ranked de vos statistiques pour suivre votre progression.
                  </p>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="group relative">
            <div class="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <q-card class="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border-2 border-blue-500/30 group-hover:border-blue-400 rounded-2xl transition-all duration-300 h-full">
              <q-card-section class="p-6">
                <div class="text-4xl mb-4">📊</div>
                <h3 class="text-2xl font-bold text-blue-400 mb-4">Historique & profils</h3>
                <p class="text-slate-300 leading-relaxed text-lg">
                  Vos statistiques détaillent chaque mode : solo, duel, trio et ranked.
                  Consultez vos victoires, séries et confrontations directes pour affiner votre stratégie.
                </p>
                <div class="mt-5 flex items-start gap-3 p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
                  <q-icon name="leaderboard" class="text-blue-300 text-2xl mt-1" />
                  <p class="text-blue-100 text-base">
                    Le classement global affiche les meilleurs joueurs en 1v1, 1v1v1 et classé.
                  </p>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </section>

      <!-- Déroulé d'une manche -->
      <section class="mb-16 lg:mb-20">
        <div class="flex items-center gap-4 mb-8">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/50">
            <q-icon name="route" size="28px" class="text-white" />
          </div>
          <h2 class="text-3xl sm:text-4xl font-black text-white">Déroulé d'une manche</h2>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div
            v-for="(step, idx) in steps"
            :key="step.index"
            class="group relative"
          >
            <div class="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
            <q-card class="relative bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border-2 border-green-500/30 group-hover:border-green-400 rounded-2xl transition-all duration-300">
              <q-card-section class="flex gap-5 p-6">
                <div class="flex-shrink-0">
                  <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/50 font-black text-xl text-white">
                    {{ step.index }}
                  </div>
                </div>
                <div class="flex-1">
                  <h3 class="text-xl font-bold text-green-400 mb-3">{{ step.title }}</h3>
                  <p class="text-slate-300 leading-relaxed text-base">{{ step.text }}</p>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </section>

      <!-- Cartes disponibles -->
      <section class="mb-16 lg:mb-20">
        <div class="flex items-center gap-4 mb-8">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/50">
            <q-icon name="style" size="28px" class="text-white" />
          </div>
          <h2 class="text-3xl sm:text-4xl font-black text-white">Cartes disponibles</h2>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          <div
            v-for="card in cards"
            :key="card.name"
            class="group relative"
          >
            <div :class="`absolute inset-0 ${card.glowClass} rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500`"></div>
            <q-card class="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-2 border-white/10 group-hover:border-white/30 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] h-full">
              <div :class="`absolute inset-0 ${card.bgGradient} opacity-10`"></div>
              
              <q-card-section class="relative p-6">
                <!-- Image de la carte -->
                <div class="mb-5 flex justify-center">
                  <div :class="`relative w-28 h-28 rounded-2xl ${card.imageBg} border-2 ${card.borderClass} shadow-2xl ${card.shadowClass} p-3 group-hover:scale-110 transition-transform duration-300`">
                    <img :src="card.image" :alt="card.name" class="w-full h-full object-contain drop-shadow-2xl" />
                  </div>
                </div>
                
                <!-- Header -->
                <div class="flex items-start justify-between gap-3 mb-4">
                  <h3 class="text-xl font-bold text-white flex-1">{{ card.name }}</h3>
                  <q-chip
                    dense
                    :class="`${card.chipBg} ${card.chipText} border ${card.chipBorder} font-bold px-3`"
                  >
                    {{ card.tag }}
                  </q-chip>
                </div>
                
                <!-- Description -->
                <p class="text-slate-300 mb-4 leading-relaxed">
                  {{ card.description }}
                </p>
                
                <!-- Hint -->
                <div :class="`flex items-start gap-3 p-3 ${card.hintBg} rounded-xl border ${card.hintBorder}`">
                  <q-icon name="tips_and_updates" :class="`${card.hintIcon} flex-shrink-0 mt-0.5`" />
                  <span :class="`text-sm ${card.hintText}`">{{ card.hint }}</span>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </section>

      <!-- Astuces -->
      <section class="mb-12">
        <div class="flex items-center gap-4 mb-8">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/50 animate-pulse">
            <q-icon name="lightbulb" size="28px" class="text-white" />
          </div>
          <h2 class="text-3xl sm:text-4xl font-black text-white">Astuces pour débuter</h2>
        </div>
        
        <div class="relative group">
          <div class="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
          <q-card class="relative bg-gradient-to-br from-amber-900/20 to-slate-900/90 backdrop-blur-xl border-2 border-amber-500/40 rounded-3xl overflow-hidden">
            <div class="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-3xl"></div>
            <q-card-section class="relative p-8 lg:p-10">
              <div class="space-y-5">
                <div class="flex gap-4 items-start group/item hover:translate-x-2 transition-transform duration-200">
                  <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/50">
                    <q-icon name="check_circle" class="text-white text-xl" />
                  </div>
                  <p class="text-slate-200 text-lg leading-relaxed pt-1">
                    Si vous connaissez la prochaine balle, adaptez votre cible (vous ou l'adversaire).
                  </p>
                </div>
                
                <div class="flex gap-4 items-start group/item hover:translate-x-2 transition-transform duration-200">
                  <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/50">
                    <q-icon name="check_circle" class="text-white text-xl" />
                  </div>
                  <p class="text-slate-200 text-lg leading-relaxed pt-1">
                    Le <strong class="text-amber-400">Double dégâts</strong> consomme la prochaine balle, même à blanc : gardez-le pour un tir sûr.
                  </p>
                </div>
                
                <div class="flex gap-4 items-start group/item hover:translate-x-2 transition-transform duration-200">
                  <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/50">
                    <q-icon name="check_circle" class="text-white text-xl" />
                  </div>
                  <p class="text-slate-200 text-lg leading-relaxed pt-1">
                    Gardez une carte défensive pour encaisser un tour difficile.
                  </p>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </section>

    </div>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router';
import heartImg from '../assets/items/heart.png';
import doubleImg from '../assets/items/double.png';
import peekImg from '../assets/items/peek.png';
import ejectImg from '../assets/items/eject.png';
import handcuffsImg from '../assets/items/handcuffs.png';
import inverterImg from '../assets/items/inverter.png';
import scannerImg from '../assets/items/scanner.png';

const router = useRouter();

const steps = [
  {
    index: '01',
    title: 'Pile ou face',
    text: "Un lancer de pièce décide qui commence. Ensuite, les joueurs alternent leurs tours."
  },
  {
    index: '02',
    title: 'Choisir une action',
    text: "À votre tour, utilisez une carte si besoin, puis choisissez une cible : vous ou l'adversaire."
  },
  {
    index: '03',
    title: 'Résoudre le tir',
    text: "Balle réelle : dégâts. Balle blanche : aucun dégât, mais la chambre avance quand même."
  },
  {
    index: '04',
    title: 'Rechargement',
    text: "Quand le barillet est vide, il est rechargé aléatoirement et chacun reçoit une nouvelle carte."
  },
  {
    index: '05',
    title: 'Partie terminée',
    text: "Quand un joueur tombe à 0 PV, la manche s'arrête. Vous pouvez relancer une nouvelle partie."
  }
];

const modes = [
  {
    title: 'Solo vs IA',
    description: 'Affrontez des bots avec plusieurs niveaux de difficulté pour progresser à votre rythme.',
    tag: 'Entraînement',
    secondary: 'Progression',
    icon: 'smart_toy',
    glow: 'bg-gradient-to-br from-emerald-500/20 to-green-500/20',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
    iconShadow: 'shadow-emerald-500/40',
    tagBg: 'bg-emerald-500/20',
    tagText: 'text-emerald-300',
    tagBorder: 'border-emerald-500/40',
    secondaryBg: 'bg-slate-500/20',
    secondaryText: 'text-slate-200',
    secondaryBorder: 'border-slate-500/40'
  },
  {
    title: 'Duel rapide 1v1',
    description: 'Matchmaking instantané hors classé : un duel rapide pour vous échauffer.',
    tag: 'Quickplay',
    secondary: 'Non classé',
    icon: 'sports_kabaddi',
    glow: 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20',
    iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    iconShadow: 'shadow-blue-500/40',
    tagBg: 'bg-blue-500/20',
    tagText: 'text-blue-300',
    tagBorder: 'border-blue-500/40',
    secondaryBg: 'bg-slate-500/20',
    secondaryText: 'text-slate-200',
    secondaryBorder: 'border-slate-500/40'
  },
  {
    title: 'Combat à trois',
    description: 'Un mode 1v1v1 plus chaotique : surveillez deux adversaires et survivez.',
    tag: '1v1v1',
    secondary: 'Non classé',
    icon: 'groups',
    glow: 'bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20',
    iconBg: 'bg-gradient-to-br from-purple-500 to-fuchsia-600',
    iconShadow: 'shadow-purple-500/40',
    tagBg: 'bg-purple-500/20',
    tagText: 'text-purple-300',
    tagBorder: 'border-purple-500/40',
    secondaryBg: 'bg-slate-500/20',
    secondaryText: 'text-slate-200',
    secondaryBorder: 'border-slate-500/40'
  },
  {
    title: 'Ranked 1v1',
    description: 'Affrontez des joueurs de votre niveau pour faire grimper votre Elo et vos ligues.',
    tag: 'Classé',
    secondary: 'Elo & ligues',
    icon: 'emoji_events',
    glow: 'bg-gradient-to-br from-amber-500/20 to-orange-500/20',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    iconShadow: 'shadow-amber-500/40',
    tagBg: 'bg-amber-500/20',
    tagText: 'text-amber-300',
    tagBorder: 'border-amber-500/40',
    secondaryBg: 'bg-orange-500/20',
    secondaryText: 'text-orange-200',
    secondaryBorder: 'border-orange-500/40'
  }
];

const cards = [
  {
    image: heartImg,
    name: '+1 Cœur',
    description: 'Soigne 1 PV (max 5).',
    tag: 'Défensif',
    hint: 'Idéal après un tir réel encaissé.',
    glowClass: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20',
    bgGradient: 'bg-gradient-to-br from-green-500 to-emerald-500',
    imageBg: 'bg-gradient-to-br from-green-500/20 to-emerald-500/10',
    borderClass: 'border-green-500/40',
    shadowClass: 'shadow-green-500/30',
    chipBg: 'bg-green-500/20',
    chipText: 'text-green-300',
    chipBorder: 'border-green-500/40',
    hintBg: 'bg-green-500/10',
    hintBorder: 'border-green-500/30',
    hintIcon: 'text-green-400',
    hintText: 'text-green-200'
  },
  {
    image: doubleImg,
    name: 'Double dégâts',
    description: 'Le prochain tir inflige 2 PV si réel (consommé même à blanc).',
    tag: 'Offensif',
    hint: 'À utiliser quand vous êtes sûr de la prochaine balle.',
    glowClass: 'bg-gradient-to-br from-red-500/20 to-orange-500/20',
    bgGradient: 'bg-gradient-to-br from-red-500 to-orange-500',
    imageBg: 'bg-gradient-to-br from-red-500/20 to-orange-500/10',
    borderClass: 'border-red-500/40',
    shadowClass: 'shadow-red-500/30',
    chipBg: 'bg-red-500/20',
    chipText: 'text-red-300',
    chipBorder: 'border-red-500/40',
    hintBg: 'bg-red-500/10',
    hintBorder: 'border-red-500/30',
    hintIcon: 'text-red-400',
    hintText: 'text-red-200'
  },
  {
    image: peekImg,
    name: 'Voir la prochaine balle',
    description: 'Révèle la cartouche suivante pour vous.',
    tag: 'Information',
    hint: 'Choisissez votre cible en connaissance de cause.',
    glowClass: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
    bgGradient: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    imageBg: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/10',
    borderClass: 'border-blue-500/40',
    shadowClass: 'shadow-blue-500/30',
    chipBg: 'bg-blue-500/20',
    chipText: 'text-blue-300',
    chipBorder: 'border-blue-500/40',
    hintBg: 'bg-blue-500/10',
    hintBorder: 'border-blue-500/30',
    hintIcon: 'text-blue-400',
    hintText: 'text-blue-200'
  },
  {
    image: ejectImg,
    name: 'Éjecter la prochaine balle',
    description: 'Retire la cartouche suivante sans tirer.',
    tag: 'Contrôle',
    hint: 'Éliminez une balle réelle dangereuse.',
    glowClass: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20',
    bgGradient: 'bg-gradient-to-br from-purple-500 to-pink-500',
    imageBg: 'bg-gradient-to-br from-purple-500/20 to-pink-500/10',
    borderClass: 'border-purple-500/40',
    shadowClass: 'shadow-purple-500/30',
    chipBg: 'bg-purple-500/20',
    chipText: 'text-purple-300',
    chipBorder: 'border-purple-500/40',
    hintBg: 'bg-purple-500/10',
    hintBorder: 'border-purple-500/30',
    hintIcon: 'text-purple-400',
    hintText: 'text-purple-200'
  },
  {
    image: handcuffsImg,
    name: 'Les Menottes',
    description: "Bloque l'adversaire au prochain tour.",
    tag: 'Contrôle',
    hint: 'Gagnez un tour de répit.',
    glowClass: 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20',
    bgGradient: 'bg-gradient-to-br from-indigo-500 to-purple-500',
    imageBg: 'bg-gradient-to-br from-indigo-500/20 to-purple-500/10',
    borderClass: 'border-indigo-500/40',
    shadowClass: 'shadow-indigo-500/30',
    chipBg: 'bg-indigo-500/20',
    chipText: 'text-indigo-300',
    chipBorder: 'border-indigo-500/40',
    hintBg: 'bg-indigo-500/10',
    hintBorder: 'border-indigo-500/30',
    hintIcon: 'text-indigo-400',
    hintText: 'text-indigo-200'
  },
  {
    image: inverterImg,
    name: "L'Inverseur",
    description: 'Inverse la balle actuelle : blanche ⇄ réelle.',
    tag: 'Chaos',
    hint: 'Retournez la situation à votre avantage.',
    glowClass: 'bg-gradient-to-br from-orange-500/20 to-yellow-500/20',
    bgGradient: 'bg-gradient-to-br from-orange-500 to-yellow-500',
    imageBg: 'bg-gradient-to-br from-orange-500/20 to-yellow-500/10',
    borderClass: 'border-orange-500/40',
    shadowClass: 'shadow-orange-500/30',
    chipBg: 'bg-orange-500/20',
    chipText: 'text-orange-300',
    chipBorder: 'border-orange-500/40',
    hintBg: 'bg-orange-500/10',
    hintBorder: 'border-orange-500/30',
    hintIcon: 'text-orange-400',
    hintText: 'text-orange-200'
  },
  {
    image: scannerImg,
    name: 'Scanner',
    description: "Révèle la position d'une balle réelle dans le barillet.",
    tag: 'Information',
    hint: 'Planifiez vos prochains tours.',
    glowClass: 'bg-gradient-to-br from-cyan-500/20 to-teal-500/20',
    bgGradient: 'bg-gradient-to-br from-cyan-500 to-teal-500',
    imageBg: 'bg-gradient-to-br from-cyan-500/20 to-teal-500/10',
    borderClass: 'border-cyan-500/40',
    shadowClass: 'shadow-cyan-500/30',
    chipBg: 'bg-cyan-500/20',
    chipText: 'text-cyan-300',
    chipBorder: 'border-cyan-500/40',
    hintBg: 'bg-cyan-500/10',
    hintBorder: 'border-cyan-500/30',
    hintIcon: 'text-cyan-400',
    hintText: 'text-cyan-200'
  }
];

const goBack = () => {
  router.push('/menu');
};
</script>

<style scoped>
@keyframes float-bullet {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-30px) rotate(90deg); }
  50% { transform: translateY(0) rotate(180deg); }
  75% { transform: translateY(30px) rotate(270deg); }
}

.animate-float-bullet {
  animation: float-bullet 20s ease-in-out infinite;
}

.animate-float-bullet-delayed {
  animation: float-bullet 20s ease-in-out infinite;
}
</style>
