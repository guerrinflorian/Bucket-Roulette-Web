import spinSrc from '../assets/audio/barrel_spin.mp3';
import reloadSrc from '../assets/audio/revolver_reload.mp3';
import shotSrc from '../assets/audio/revolver_shot.mp3';
import blankSrc from '../assets/audio/revolver_no_ammo_shot.mp3';
import backgroundSrc from '../assets/audio/background.mp3';

const SOUND_MAP = {
  spin: spinSrc,
  shot: shotSrc,
  blank: blankSrc,
  reload: reloadSrc,
  click: reloadSrc // Fallback pour les items
};

class AudioManager {
  constructor() {
    this.sounds = {};
    this.background = new Audio(backgroundSrc);
    this.background.loop = true;
    this.background.volume = 0.02;
    Object.entries(SOUND_MAP).forEach(([key, src]) => {
      const audio = new Audio(src);
      audio.volume = 0.6;
      this.sounds[key] = audio;
    });
  }

  play(key) {
    const audio = this.sounds[key];
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch((err) => {
      console.warn(`Could not play audio ${key}:`, err);
    });
  }

  startBackground() {
    if (!this.background || !this.background.paused) return;
    this.background.play().catch((err) => {
      console.warn('Could not play background audio:', err);
    });
  }

  stopBackground() {
    if (!this.background) return;
    this.background.pause();
    this.background.currentTime = 0;
  }
}

export const audioManager = new AudioManager();
