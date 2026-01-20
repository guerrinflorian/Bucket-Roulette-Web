import spinSrc from '../assets/audio/barrel_spin.mp3';
import reloadSrc from '../assets/audio/revolver_reload.mp3';
import shotSrc from '../assets/audio/revolver_shot.mp3';
import blankSrc from '../assets/audio/revolver_no_ammo_shot.mp3';

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
}

export const audioManager = new AudioManager();
