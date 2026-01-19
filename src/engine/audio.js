const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA=';

const SOUND_MAP = {
  click: SILENT_WAV,
  shot: SILENT_WAV,
  blank: SILENT_WAV,
  reload: SILENT_WAV
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
    audio.play().catch(() => {});
  }
}

export const audioManager = new AudioManager();
