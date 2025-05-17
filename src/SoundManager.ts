export class SoundManager {
  private static sounds: { [key: string]: HTMLAudioElement } = {};

  public static load(name: string, url: string): void {
    if (!this.sounds[name]) {
      const audio = new Audio(url);
      this.sounds[name] = audio;
    }
  }

  public static play(name: string): void {
    const audio = this.sounds[name];
    if (audio) {
      // Clone the audio element to allow overlapping sounds
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.play();
    }
  }
} 