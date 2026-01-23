<template>
  <div class="bg-effects" aria-hidden="true">
    <div class="bg-gradient"></div>
    <div class="bg-grid"></div>
    <div class="floating-bullets">
      <div class="bullet b1">🔴</div>
      <div class="bullet b2">⚪</div>
      <div class="bullet b3">🔴</div>
      <div class="bullet b4">⚪</div>
      <div class="bullet b5">🔴</div>
    </div>
  </div>
</template>

<style scoped>
.bg-effects {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(220, 38, 38, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 100% 100%, rgba(245, 158, 11, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse 50% 30% at 0% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 50%);
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 70%);
}

.floating-bullets {
  position: absolute;
  inset: 0;
}

.bullet {
  position: absolute;
  font-size: 20px;
  opacity: 0.15;
  animation: float-bullet 20s ease-in-out infinite;
}

.b1 { top: 15%; left: 10%; animation-delay: 0s; }
.b2 { top: 25%; right: 15%; animation-delay: -4s; }
.b3 { top: 60%; left: 5%; animation-delay: -8s; }
.b4 { top: 70%; right: 8%; animation-delay: -12s; }
.b5 { top: 85%; left: 50%; animation-delay: -16s; }

@keyframes float-bullet {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-30px) rotate(90deg); }
  50% { transform: translateY(0) rotate(180deg); }
  75% { transform: translateY(30px) rotate(270deg); }
}
</style>
