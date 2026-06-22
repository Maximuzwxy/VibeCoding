class AudioManager {
    constructor() {
        this.ctx = null;
        this.initialized = false;
        this.cachedVoice = null;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    initVoice() {
        const tryCache = () => {
            const voices = speechSynthesis.getVoices();

            const wanLung = voices.find(v => v.name.includes('WanLung'));
            const huihui = voices.find(v => v.name.includes('Huihui'));

            if (huihui) {
                this.cachedVoice = huihui;
                return true;
            } else if (wanLung) {
                this.cachedVoice = wanLung;
                this.warmUp();
                return true;
            } else {
                const zhVoices = voices.filter(v => v.lang.startsWith('zh'));
                if (zhVoices.length > 0) {
                    this.cachedVoice = zhVoices[0];
                    return true;
                }
                return false;
            }
        };

        if (tryCache()) return;

        speechSynthesis.onvoiceschanged = () => {
            if (this.cachedVoice) return;
            tryCache();
        };

        setTimeout(() => {
            if (!this.cachedVoice) {
                tryCache();
            }
        }, 2000);
    }

    warmUp() {
        const utterance = new SpeechSynthesisUtterance('');
        utterance.voice = this.cachedVoice;
        utterance.volume = 0;
        speechSynthesis.speak(utterance);
        setTimeout(() => speechSynthesis.cancel(), 100);
    }

    speak(text) {
        if (!this.cachedVoice) {
            return;
        }

        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.cachedVoice;
        utterance.rate = 1.0;
        utterance.pitch = 0.9;
        utterance.volume = 1.0;
        speechSynthesis.speak(utterance);
    }

    playGunshot(volume = 1.0) {
        if (!this.initialized) return;

        const now = this.ctx.currentTime;

        const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.12, this.ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            const t = i / this.ctx.sampleRate;
            data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 28);
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, now);
        filter.frequency.exponentialRampToValueAtTime(800, now + 0.08);
        filter.Q.value = 1;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.8 * volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);

        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0.5 * volume, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);

        const subOsc = this.ctx.createOscillator();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(150, now);
        subOsc.frequency.exponentialRampToValueAtTime(80, now + 0.06);

        const subGain = this.ctx.createGain();
        subGain.gain.setValueAtTime(0.4 * volume, now);
        subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 0.06);
    }

    playHit(volume = 1.0) {
        if (!this.initialized) return;

        const now = this.ctx.currentTime;

        const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.15, this.ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            const t = i / this.ctx.sampleRate;
            data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 30);
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(150, now + 0.1);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.6 * volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
        noise.stop(now + 0.15);

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0.4 * volume, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    playMiss(volume = 1.0) {
        if (!this.initialized) return;

        const now = this.ctx.currentTime;

        const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 5);
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2000;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2 * volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
        noise.stop(now + 0.05);
    }

    playFootstep(volume = 1.0) {
        if (!this.initialized) return;

        const now = this.ctx.currentTime;

        const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 4);
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 1;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.15 * volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
        noise.stop(now + 0.08);
    }

    playExplosion(volume = 1.0) {
        if (!this.initialized) return;

        const now = this.ctx.currentTime;

        const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.5, this.ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            const t = i / this.ctx.sampleRate;
            data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 6);
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.4);
        filter.Q.value = 0.5;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(1.0 * volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0.8 * volume, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);

        const subOsc = this.ctx.createOscillator();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(80, now);
        subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

        const subGain = this.ctx.createGain();
        subGain.gain.setValueAtTime(0.6 * volume, now);
        subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 0.4);
    }
}

const audioManager = new AudioManager();
