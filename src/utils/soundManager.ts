export class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;

  constructor() {
    this.loadSounds();
  }

  private loadSounds() {
    const soundFiles = {
      join: '/sounds/join.mp3',
      vote: '/sounds/vote.mp3',
      success: '/sounds/success.mp3',
      fail: '/sounds/fail.mp3',
      reveal: '/sounds/reveal.mp3',
      gameOver: '/sounds/game-over.mp3'
    };

    for (const [name, path] of Object.entries(soundFiles)) {
      const audio = new Audio(path);
      audio.preload = 'auto';
      this.sounds.set(name, audio);
    }
  }

  public play(soundName: string) {
    if (!this.enabled) return;
    
    const sound = this.sounds.get(soundName);
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(console.error);
    }
  }

  public toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}