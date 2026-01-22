<template>
  <q-page class="help-page">
    <div class="help-bg">
      <div class="help-gradient"></div>
      <div class="help-grid"></div>
      <div class="help-embers">
        <span class="ember e1">🔥</span>
        <span class="ember e2">✨</span>
        <span class="ember e3">🔴</span>
        <span class="ember e4">⚪</span>
      </div>
    </div>

    <div class="help-content">
      <header class="help-hero">
        <q-btn flat class="help-back" icon="arrow_back" label="Retour au menu" @click="goBack" />

        <div class="hero-title">
          <q-chip class="hero-kicker" icon="auto_awesome">Guide du duel</q-chip>
          <h1>Aide & règles du jeu</h1>
          <p>
            Pas besoin d'être un expert : voici les règles expliquées simplement, étape par étape,
            avec les cartes disponibles et des astuces pour survivre.
          </p>
        </div>
      </header>

      <section class="help-section">
        <div class="section-title">
          <q-icon name="sports_martial_arts" />
          <h2>Objectif & principes</h2>
        </div>
        <div class="help-cards">
          <q-card class="help-card">
            <q-card-section>
              <h3>Dernier survivant</h3>
              <p>
                Vous commencez avec <strong>5 PV</strong>. Chaque balle réelle retire des PV. Le dernier
                joueur debout remporte la manche.
              </p>
            </q-card-section>
          </q-card>
          <q-card class="help-card">
            <q-card-section>
              <h3>Barillet aléatoire</h3>
              <p>
                Le barillet contient <strong>2 à 7</strong> cartouches mélangées (réelles + blanches). Quand
                il est vide, il est rechargé et remixé.
              </p>
            </q-card-section>
          </q-card>
          <q-card class="help-card">
            <q-card-section>
              <h3>Cartes tactiques</h3>
              <p>
                Après chaque rechargement, vous recevez <strong>1 carte</strong>. Elles servent à manipuler
                le barillet ou votre adversaire.
              </p>
            </q-card-section>
          </q-card>
        </div>
      </section>

      <section class="help-section">
        <div class="section-title">
          <q-icon name="insights" />
          <h2>Pourquoi tirer sur soi ?</h2>
        </div>
        <q-card class="help-card wide-card">
          <q-card-section>
            <p>
              Tenter un tir sur vous-même peut paraître étrange, mais c'est un choix stratégique :
              si la balle est blanche, <strong>vous ne perdez aucun PV</strong> et vous gagnez un nouveau tour.
              Cela permet d'enchaîner les actions, d'utiliser vos cartes, ou de forcer l'adversaire à subir
              un barillet plus dangereux.
            </p>
            <p class="muted">
              En résumé : tirer sur soi est un pari pour conserver l'initiative quand vous pensez que la
              prochaine balle est blanche.
            </p>
          </q-card-section>
        </q-card>
      </section>

      <section class="help-section">
        <div class="section-title">
          <q-icon name="route" />
          <h2>Déroulé d'une manche</h2>
        </div>
        <div class="steps-grid">
          <q-card v-for="step in steps" :key="step.title" class="step-card">
            <q-card-section>
              <div class="step-head">
                <q-badge color="amber-7" text-color="black">{{ step.index }}</q-badge>
                <h3>{{ step.title }}</h3>
              </div>
              <p>{{ step.text }}</p>
            </q-card-section>
          </q-card>
        </div>
      </section>

      <section class="help-section">
        <div class="section-title">
          <q-icon name="style" />
          <h2>Cartes disponibles</h2>
        </div>
        <div class="cards-grid">
          <q-card v-for="card in cards" :key="card.name" class="game-card">
            <q-card-section horizontal class="card-row">
              <q-img
                :src="card.image"
                class="card-image"
                :alt="card.name"
                fit="contain"
                ratio="1"
                loading="eager"
              />
              <q-card-section class="card-body">
                <div class="card-header">
                  <h3>{{ card.name }}</h3>
                  <q-chip dense outline color="blue-4" text-color="blue-2">{{ card.tag }}</q-chip>
                </div>
                <p>{{ card.description }}</p>
                <div class="card-hint-row">
                  <q-icon name="task_alt" size="16px" class="card-hint-icon" />
                  <span class="card-hint">{{ card.hint }}</span>
                </div>
              </q-card-section>
            </q-card-section>
          </q-card>
        </div>
      </section>

      <section class="help-section tips">
        <div class="section-title">
          <q-icon name="lightbulb" />
          <h2>Astuces pour débuter</h2>
        </div>
        <q-card class="help-card wide-card">
          <q-card-section>
            <ul>
              <li>Si vous connaissez la prochaine balle, adaptez votre cible (vous ou l'adversaire).</li>
              <li>Le <strong>Double dégâts</strong> consomme la prochaine balle, même à blanc : gardez-le pour un tir sûr.</li>
              <li>Gardez une carte défensive pour encaisser un tour difficile.</li>
            </ul>
          </q-card-section>
        </q-card>
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

const cards = [
  {
    image: heartImg,
    name: '+1 Coeur',
    description: 'Soigne 1 PV (max 5).',
    tag: 'Défensif',
    hint: 'Idéal après un tir réel encaissé.'
  },
  {
    image: doubleImg,
    name: 'Double dégâts',
    description: 'Le prochain tir inflige 2 PV si réel (consommé même à blanc).',
    tag: 'Offensif',
    hint: 'À utiliser quand vous êtes sûr de la prochaine balle.'
  },
  {
    image: peekImg,
    name: 'Voir la prochaine balle',
    description: 'Révèle la cartouche suivante pour vous.',
    tag: 'Information',
    hint: 'Choisissez votre cible en connaissance de cause.'
  },
  {
    image: ejectImg,
    name: 'Éjecter la prochaine balle',
    description: 'Retire la cartouche suivante sans tirer.',
    tag: 'Contrôle',
    hint: 'Éliminez une balle réelle dangereuse.'
  },
  {
    image: handcuffsImg,
    name: 'Les Menottes',
    description: "Bloque l'adversaire au prochain tour.",
    tag: 'Contrôle',
    hint: 'Gagnez un tour de répit.'
  },
  {
    image: inverterImg,
    name: "L'Inverseur",
    description: 'Inverse la balle actuelle : blanche ⇄ réelle.',
    tag: 'Chaos',
    hint: 'Retournez la situation à votre avantage.'
  },
  {
    image: scannerImg,
    name: 'Scanner',
    description: "Révèle la position d'une balle réelle dans le barillet.",
    tag: 'Information',
    hint: 'Planifiez vos prochains tours.'
  }
];

const goBack = () => {
  router.push('/menu');
};
</script>

<style scoped>
.help-page {
  position: relative;
  min-height: 100vh;
  color: #f8fafc;
  background: #0b0a08;
  overflow: hidden;
}

.help-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.help-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 20%, rgba(255, 178, 102, 0.22), transparent 50%),
    radial-gradient(circle at 80% 10%, rgba(250, 204, 21, 0.2), transparent 45%),
    radial-gradient(circle at 50% 80%, rgba(148, 163, 184, 0.12), transparent 55%),
    linear-gradient(160deg, rgba(7, 7, 7, 0.95), rgba(20, 10, 5, 0.98));
}

.help-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 120px 120px;
  opacity: 0.35;
}

.help-embers {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.ember {
  position: absolute;
  font-size: 18px;
  opacity: 0.5;
  filter: blur(0.2px);
  animation: float 6s ease-in-out infinite;
}

.ember.e1 { top: 20%; left: 10%; animation-delay: 0s; }
.ember.e2 { top: 70%; left: 15%; animation-delay: 1s; }
.ember.e3 { top: 25%; right: 12%; animation-delay: 0.5s; }
.ember.e4 { bottom: 10%; right: 20%; animation-delay: 1.5s; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.help-content {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 20px 80px;
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.help-hero {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: flex-start;
}

.help-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(15, 23, 42, 0.4);
  color: #f8fafc;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.help-back:hover {
  border-color: rgba(251, 191, 36, 0.8);
  box-shadow: 0 0 14px rgba(251, 191, 36, 0.25);
  transform: translateY(-1px);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.section-title h2 {
  margin: 0;
  font-size: 1.6rem;
}

.section-title .q-icon {
  color: #fbbf24;
  font-size: 22px;
}

.hero-title h1 {
  font-size: clamp(2rem, 4vw, 3.1rem);
  margin: 0;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.hero-title p {
  margin: 10px 0 0;
  color: rgba(226, 232, 240, 0.75);
  max-width: 620px;
  font-size: 1rem;
}

.hero-kicker {
  display: inline-flex;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  background: rgba(251, 191, 36, 0.15);
  color: #fcd34d;
  font-weight: 700;
}

.help-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
}

.help-card {
  padding: 18px 20px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.help-card.wide-card {
  max-width: 900px;
}

.help-card h3 {
  margin: 0 0 8px;
  font-size: 1.1rem;
}

.help-card p {
  margin: 0;
  color: rgba(226, 232, 240, 0.7);
  line-height: 1.5;
}

.steps-grid {
  display: grid;
  gap: 16px;
}

.step-card {
  padding: 16px 18px;
  border-radius: 14px;
  background: rgba(2, 6, 23, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.step-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.step-head h3 {
  margin: 0;
  font-size: 1rem;
}

.step-card p {
  margin: 0;
  color: rgba(226, 232, 240, 0.75);
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.game-card {
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(251, 191, 36, 0.2);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.card-row {
  align-items: center;
  gap: 12px;
}

.card-image {
  width: 88px;
  height: 88px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.2);
  margin: 12px;
}

.card-body {
  padding-left: 4px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.card-body h3 {
  margin: 0 0 6px;
  font-size: 1rem;
}

.card-body p {
  margin: 0 0 8px;
  color: rgba(226, 232, 240, 0.75);
}

.card-hint-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-hint-icon {
  color: rgba(148, 163, 184, 0.9);
}

.card-hint {
  font-size: 0.78rem;
  color: rgba(148, 163, 184, 0.9);
}

.tips ul {
  margin: 0;
  padding-left: 20px;
  color: rgba(226, 232, 240, 0.8);
  line-height: 1.6;
}

.tips li + li {
  margin-top: 10px;
}

.muted {
  color: rgba(148, 163, 184, 0.85);
  margin-top: 10px;
}

@media (min-width: 900px) {
  .steps-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .card-image {
    width: 70px;
    height: 70px;
    margin: 10px;
  }
}
</style>
