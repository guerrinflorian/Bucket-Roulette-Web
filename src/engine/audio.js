import spinSrc from '../assets/audio/barrel_spin.mp3';
import reloadSrc from '../assets/audio/revolver_reload.mp3';
import shotSrc from '../assets/audio/revolver_shot.mp3';
import blankSrc from '../assets/audio/revolver_no_ammo_shot.mp3';
import backgroundSrc from '../assets/audio/background.mp3';
import notificationSrc from '../assets/audio/notification.mp3';

const SOUND_MAP = {
  spin: spinSrc,
  shot: shotSrc,
  blank: blankSrc,
  reload: reloadSrc,
  click: reloadSrc, // Fallback pour les items
  notification: notificationSrc
};

class AudioManager {
  constructor() {
    this.sounds = {};
    this.soundPools = {};
    this.background = new Audio(backgroundSrc);
    this.background.loop = true;
    this.background.volume = 0.02;
    Object.entries(SOUND_MAP).forEach(([key, src]) => {
      const audio = this.createAudio(src, 0.6);
      this.sounds[key] = audio;
      this.soundPools[key] = [audio];
    });
  }

  createAudio(src, volume) {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.volume = volume;
    return audio;
  }

  play(key) {
    const pool = this.soundPools[key];
    if (!pool || pool.length === 0) return;
    let audio = pool.find((candidate) => candidate.paused || candidate.ended);
    if (!audio) {
      const baseAudio = this.sounds[key];
      audio = this.createAudio(baseAudio.src, baseAudio.volume);
      pool.push(audio);
    }
    if (!audio.src || !audio.canPlayType('audio/mpeg')) {
      return;
    }
    if (audio.currentTime !== 0) {
      audio.currentTime = 0;
    }
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

  unlock() {
    // Attempt to unlock audio context on mobile
    const unlockSound = (audio) => {
      if (!audio) return;
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch(() => { });
    };

    unlockSound(this.background);
    Object.values(this.sounds).forEach(audio => unlockSound(audio));
  }
}

export const audioManager = new AudioManager();
