class FocusAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  
  // Oscillators for ambient drone/flute/instrumental
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private osc3: OscillatorNode | null = null;
  private currentType: string = 'none';
  private rumbleInterval: any = null;

  start(type: string) {
    this.stop();
    if (type === 'none') return;
    this.currentType = type;

    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // We can synthesize drones differently from noise
    if (type === 'flute' || type === 'ambient' || type === 'instrumental') {
        this.startDrone(type);
        return;
    }

    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of buffer
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);

    // Generate noise
    for (let i = 0; i < bufferSize; i++) {
        let white = Math.random() * 2 - 1;
        
        if (type === 'rain' || type === 'brown' || type === 'thunderstorm') {
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
        } else if (type === 'water' || type === 'crackle' || type === 'cafe') {
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + white * 0.5362;
            output[i] *= 0.11;
        } else {
            output[i] = white;
        }
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;

    this.filterNode = this.ctx.createBiquadFilter();
    this.gainNode = this.ctx.createGain();

    if (type === 'rain' || type === 'thunderstorm') {
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.value = 800;
        this.gainNode.gain.value = 0.5;
    } else if (type === 'brown') {
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.value = 400;
        this.gainNode.gain.value = 0.8;
    } else if (type === 'water') {
        this.filterNode.type = 'bandpass';
        this.filterNode.frequency.value = 800;
        this.gainNode.gain.value = 0.4;
    } else if (type === 'crackle' || type === 'cafe') {
        this.filterNode.type = 'bandpass';
        this.filterNode.frequency.value = type === 'cafe' ? 400 : 2000;
        this.gainNode.gain.value = type === 'cafe' ? 0.1 : 0.25;
    }

    this.noiseNode.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);
    
    this.noiseNode.start(0);

    if (type === 'thunderstorm') {
       this.rumbleInterval = setInterval(() => {
          if (Math.random() > 0.7 && this.ctx && this.gainNode) {
             const rumble = this.ctx.createOscillator();
             rumble.type = 'sine';
             rumble.frequency.setValueAtTime(40, this.ctx.currentTime);
             rumble.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 2);
             
             const rGain = this.ctx.createGain();
             rGain.gain.setValueAtTime(0, this.ctx.currentTime);
             rGain.gain.linearRampToValueAtTime(0.8, this.ctx.currentTime + 0.5);
             rGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 4);
             
             rumble.connect(rGain);
             rGain.connect(this.gainNode);
             rumble.start();
             rumble.stop(this.ctx.currentTime + 4);
          }
       }, 5000);
    }
  }

  startDrone(type: string) {
     if (!this.ctx) return;
     this.gainNode = this.ctx.createGain();
     this.gainNode.connect(this.ctx.destination);
     this.gainNode.gain.value = 0.2; // Default volume hook

     this.osc1 = this.ctx.createOscillator();
     this.osc2 = this.ctx.createOscillator();
     this.osc3 = this.ctx.createOscillator();

     if (type === 'flute') {
         this.osc1.type = 'sine';
         this.osc1.frequency.value = 440; // A4
         this.osc2.type = 'triangle';
         this.osc2.frequency.value = 880; // A5
         this.osc3.type = 'sine';
         this.osc3.frequency.value = 882;
     } else if (type === 'instrumental') {
         // Generative pad
         this.osc1.type = 'sine';
         this.osc1.frequency.value = 220; // A3
         this.osc2.type = 'triangle';
         this.osc2.frequency.value = 277.18; // C#4
         this.osc3.type = 'sine';
         this.osc3.frequency.value = 329.63; // E4
     } else {
         // Ambient space
         this.osc1.type = 'sine';
         this.osc1.frequency.value = 110; 
         this.osc2.type = 'sine';
         this.osc2.frequency.value = 111.5;
         this.osc3.type = 'triangle';
         this.osc3.frequency.value = 55;
     }

     const filter = this.ctx.createBiquadFilter();
     filter.type = 'lowpass';
     filter.frequency.value = type === 'flute' ? 1200 : 800;

     this.osc1.connect(filter);
     this.osc2.connect(filter);
     this.osc3.connect(filter);
     filter.connect(this.gainNode);

     this.osc1.start(0);
     this.osc2.start(0);
     this.osc3.start(0);
  }

  stop() {
    this.currentType = 'none';
    if (this.rumbleInterval) {
       clearInterval(this.rumbleInterval);
       this.rumbleInterval = null;
    }
    if (this.noiseNode) {
      try { this.noiseNode.stop(); } catch(e){}
      this.noiseNode.disconnect();
      this.noiseNode = null;
    }
    if (this.osc1) {
      try { this.osc1.stop(); this.osc2?.stop(); this.osc3?.stop(); } catch(e){}
      this.osc1.disconnect();
      this.osc2?.disconnect();
      this.osc3?.disconnect();
      this.osc1 = null;
      this.osc2 = null;
      this.osc3 = null;
    }
    if (this.filterNode) {
        this.filterNode.disconnect();
        this.filterNode = null;
    }
  }

  setVolume(val: number) {
     if (this.gainNode) {
         this.gainNode.gain.value = val;
     }
  }
}

let lastOut = 0;
let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0;

export const focusAudio = new FocusAudioEngine();
