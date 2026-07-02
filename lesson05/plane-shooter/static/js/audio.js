/**
 * Plane Shooter - Audio Manager
 * Handles all sound effects and background music using Web Audio API
 */

class AudioManager {
    constructor() {
        this.soundsEnabled = true;
        this.musicEnabled = true;
        this.initialized = false;
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.bgmOscillators = [];
        this.isMusicPlaying = false;
    }

    /**
     * Initialize audio (must be called after user interaction)
     */
    init() {
        if (this.initialized) return;

        try {
            // Create AudioContext
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 1.0;
            this.masterGain.connect(this.audioContext.destination);
            
            // Create music gain
            this.musicGain = this.audioContext.createGain();
            this.musicGain.gain.value = 0.3; // Lower volume for music
            this.musicGain.connect(this.masterGain);
            
            // Create SFX gain
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.value = 0.5;
            this.sfxGain.connect(this.masterGain);
            
            this.initialized = true;
            console.log('🔊 Audio initialized');
        } catch (e) {
            console.error('Audio init failed:', e);
        }
    }

    /**
     * Resume audio context if suspended
     */
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    /**
     * Play a sound effect
     */
    play(soundName) {
        if (!this.soundsEnabled || !this.initialized) return;
        
        this.resume();
        this.playGeneratedSound(soundName);
    }

    /**
     * Generate sounds using Web Audio API
     */
    playGeneratedSound(name) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);

        const now = this.audioContext.currentTime;

        switch (name) {
            case 'shoot':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(880, now);
                oscillator.frequency.exponentialRampToValueAtTime(110, now + 0.1);
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                oscillator.start(now);
                oscillator.stop(now + 0.1);
                break;

            case 'explosion':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(100, now);
                oscillator.frequency.exponentialRampToValueAtTime(10, now + 0.3);
                gainNode.gain.setValueAtTime(0.5, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                oscillator.start(now);
                oscillator.stop(now + 0.3);
                break;

            case 'powerup':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(523.25, now); // C5
                oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
                oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.linearRampToValueAtTime(0.01, now + 0.3);
                oscillator.start(now);
                oscillator.stop(now + 0.3);
                break;

            case 'bossAlert':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(220, now);
                oscillator.frequency.setValueAtTime(220, now + 0.2);
                oscillator.frequency.setValueAtTime(165, now + 0.4);
                oscillator.frequency.setValueAtTime(165, now + 0.6);
                gainNode.gain.setValueAtTime(0.4, now);
                gainNode.gain.linearRampToValueAtTime(0.01, now + 0.8);
                oscillator.start(now);
                oscillator.stop(now + 0.8);
                break;

            case 'hit':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(196, now);
                oscillator.frequency.exponentialRampToValueAtTime(49, now + 0.2);
                gainNode.gain.setValueAtTime(0.4, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                oscillator.start(now);
                oscillator.stop(now + 0.2);
                break;

            case 'bomb':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(150, now);
                oscillator.frequency.exponentialRampToValueAtTime(20, now + 0.5);
                gainNode.gain.setValueAtTime(0.6, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                oscillator.start(now);
                oscillator.stop(now + 0.5);
                break;
                
            case 'levelComplete':
                // Victory fanfare
                const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
                notes.forEach((freq, i) => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc.type = 'square';
                    osc.frequency.value = freq;
                    osc.connect(gain);
                    gain.connect(this.sfxGain);
                    const noteTime = now + i * 0.15;
                    gain.gain.setValueAtTime(0.3, noteTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.15);
                    osc.start(noteTime);
                    osc.stop(noteTime + 0.15);
                });
                break;
        }
    }

    /**
     * Start background music (simple procedural melody)
     */
    startMusic() {
        if (!this.musicEnabled || !this.initialized) return;
        
        this.resume();
        
        if (this.isMusicPlaying) return;
        
        this.isMusicPlaying = true;
        this.playBackgroundMusic();
    }

    /**
     * Play procedural background music loop
     */
    playBackgroundMusic() {
        if (!this.isMusicPlaying || !this.musicEnabled) return;
        
        // Simple ambient drone
        const frequencies = [65.41, 98.00, 130.81]; // C2, G2, C3
        
        frequencies.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            osc.connect(gain);
            gain.connect(this.musicGain);
            
            gain.gain.value = 0.15;
            
            osc.start();
            this.bgmOscillators.push({ osc, gain });
        });
    }

    /**
     * Stop background music
     */
    stopMusic() {
        this.isMusicPlaying = false;
        
        // Stop all music oscillators
        this.bgmOscillators.forEach(({ osc, gain }) => {
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            osc.stop(this.audioContext.currentTime + 0.5);
        });
        this.bgmOscillators = [];
    }

    /**
     * Set sounds enabled
     */
    setSoundsEnabled(enabled) {
        this.soundsEnabled = enabled;
        if (this.sfxGain) {
            this.sfxGain.gain.value = enabled ? 0.5 : 0;
        }
    }

    /**
     * Set music enabled
     */
    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        if (this.musicGain) {
            this.musicGain.gain.value = enabled ? 0.3 : 0;
        }
        
        if (enabled && !this.isMusicPlaying) {
            this.startMusic();
        } else if (!enabled) {
            this.stopMusic();
        }
    }

    /**
     * Set master volume
     */
    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }
}

// Global audio manager instance
const audioManager = new AudioManager();
