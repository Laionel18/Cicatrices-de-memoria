// audio-system.js - Sistema de audio procedural
class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.ambientSounds = {};
        this.scarySounds = [];
        this.isMuted = false;
        this.masterVolume = 0.7;
        
        this.init();
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.setupAudioNodes();
            this.generateProceduralSounds();
        } catch (e) {
            console.warn('Audio no disponible:', e);
        }
    }

    setupAudioNodes() {
        // Nodo maestro de salida
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = this.masterVolume;
        this.masterGain.connect(this.audioContext.destination);
        
        // Nodo para efectos
        this.effectsGain = this.audioContext.createGain();
        this.effectsGain.connect(this.masterGain);
        
        // Nodo para ambiente
        this.ambientGain = this.audioContext.createGain();
        this.ambientGain.connect(this.masterGain);
    }

    generateProceduralSounds() {
        // Sonido de viento ambiental
        this.ambientSounds.wind = this.createWindSound();
        
        // Sonido de susurros
        this.ambientSounds.whispers = this.createWhisperSound();
        
        // Latido del corazón
        this.ambientSounds.heartbeat = this.createHeartbeatSound();
        
        // Sonidos de terror
        this.scarySounds = [
            this.createScarySound1(),
            this.createScarySound2(),
            this.createScarySound3()
        ];
        
        // Sonido de pasos
        this.stepSound = this.createStepSound();
        
        // Sonido de linterna
        this.flashlightSound = this.createFlashlightSound();
        
        // Sonido de recolección
        this.collectSound = this.createCollectSound();
    }

    createWindSound() {
        if (!this.audioContext) return null;
        
        const oscillator = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 60;
        
        // LFO para variación
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.frequency.value = 0.2;
        lfoGain.gain.value = 30;
        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);
        
        // Filtro low-pass para sonido de viento
        filter.type = 'lowpass';
        filter.frequency.value = 500;
        
        // Ganancia
        gain.gain.value = 0.05;
        
        // Conexiones
        oscillator.connect(filter);
        filter.connect(gain);
        gain.connect(this.ambientGain);
        
        // Iniciar
        oscillator.start();
        lfo.start();
        
        return { oscillator, gain, lfo, filter };
    }

    createWhisperSound() {
        if (!this.audioContext) return null;
        
        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generar ruido blanco
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        // Crear fuente de audio
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        // Filtro para sonido de susurro
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 1;
        
        // Ganancia
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.03;
        
        // LFO para variación
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.frequency.value = 0.5;
        lfoGain.gain.value = 300;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        
        // Conexiones
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ambientGain);
        
        // Iniciar
        source.start();
        lfo.start();
        
        return { source, gain, lfo };
    }

    createHeartbeatSound() {
        if (!this.audioContext) return null;
        
        const scheduleHeartbeat = () => {
            const now = this.audioContext.currentTime;
            
            // Primer latido
            this.playHeartbeat(now);
            
            // Segundo latido
            this.playHeartbeat(now + 0.15);
            
            // Programar próximo latido (60 BPM)
            setTimeout(scheduleHeartbeat, 1000);
        };
        
        return { scheduleHeartbeat };
    }

    playHeartbeat(time) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 80;
        
        // Envolvente del latido
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.1, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        
        oscillator.connect(gain);
        gain.connect(this.ambientGain);
        
        oscillator.start(time);
        oscillator.stop(time + 0.2);
    }

    createStepSound() {
        return {
            play: () => {
                if (!this.audioContext || this.isMuted) return;
                
                const time = this.audioContext.currentTime;
                
                // Crear ruido para el paso
                const bufferSize = this.audioContext.sampleRate * 0.1;
                const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                
                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;
                
                // Filtro para sonido de paso
                const filter = this.audioContext.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 300;
                
                // Ganancia con envolvente
                const gain = this.audioContext.createGain();
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(0.1, time + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
                
                // Conexiones
                source.connect(filter);
                filter.connect(gain);
                gain.connect(this.effectsGain);
                
                source.start(time);
                source.stop(time + 0.2);
            }
        };
    }

    createFlashlightSound() {
        return {
            play: () => {
                if (!this.audioContext || this.isMuted) return;
                
                const time = this.audioContext.currentTime;
                
                const oscillator = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                oscillator.type = 'sine';
                oscillator.frequency.value = 800;
                
                // Envolvente corta
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(0.05, time + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
                
                oscillator.connect(gain);
                gain.connect(this.effectsGain);
                
                oscillator.start(time);
                oscillator.stop(time + 0.1);
            }
        };
    }

    createScarySound1() {
        // Grito distorsionado
        return () => {
            if (!this.audioContext || this.isMuted) return;
            
            const time = this.audioContext.currentTime;
            const duration = 1.5;
            
            // Oscilador principal
            const oscillator = this.audioContext.createOscillator();
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, time);
            oscillator.frequency.exponentialRampToValueAtTime(100, time + duration);
            
            // LFO para distorsión
            const lfo = this.audioContext.createOscillator();
            const lfoGain = this.audioContext.createGain();
            lfo.frequency.value = 30;
            lfoGain.gain.value = 100;
            lfo.connect(lfoGain);
            lfoGain.connect(oscillator.frequency);
            
            // Ganancia con envolvente
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.2, time + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
            
            // Distorsión
            const waveShaper = this.audioContext.createWaveShaper();
            waveShaper.curve = this.makeDistortionCurve(400);
            
            // Conexiones
            oscillator.connect(waveShaper);
            waveShaper.connect(gain);
            gain.connect(this.effectsGain);
            
            // Iniciar
            oscillator.start(time);
            lfo.start(time);
            oscillator.stop(time + duration);
            lfo.stop(time + duration);
        };
    }

    makeDistortionCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        
        for (let i = 0; i < samples; i++) {
            const x = i * 2 / samples - 1;
            curve[i] = (3 + amount) * x * 20 * deg / (Math.PI + amount * Math.abs(x));
        }
        
        return curve;
    }

    createCollectSound() {
        return {
            play: () => {
                if (!this.audioContext || this.isMuted) return;
                
                const time = this.audioContext.currentTime;
                
                // Sonido ascendente para recolección
                const oscillator = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(300, time);
                oscillator.frequency.exponentialRampToValueAtTime(800, time + 0.3);
                
                // Envolvente
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(0.1, time + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
                
                oscillator.connect(gain);
                gain.connect(this.effectsGain);
                
                oscillator.start(time);
                oscillator.stop(time + 0.3);
            }
        };
    }

    playRandomScarySound() {
        if (this.scarySounds.length === 0 || this.isMuted) return;
        
        const sound = this.scarySounds[Math.floor(Math.random() * this.scarySounds.length)];
        sound();
    }

    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
        }
        return this.isMuted;
    }

    startAmbient() {
        if (this.ambientSounds.wind && this.ambientSounds.wind.gain) {
            this.ambientSounds.wind.gain.gain.value = 0.05;
        }
        if (this.ambientSounds.whispers && this.ambientSounds.whispers.gain) {
            this.ambientSounds.whispers.gain.gain.value = 0.03;
        }
        if (this.ambientSounds.heartbeat) {
            this.ambientSounds.heartbeat.scheduleHeartbeat();
        }
    }

    stopAmbient() {
        if (this.ambientSounds.wind && this.ambientSounds.wind.gain) {
            this.ambientSounds.wind.gain.gain.value = 0;
        }
        if (this.ambientSounds.whispers && this.ambientSounds.whispers.gain) {
            this.ambientSounds.whispers.gain.gain.value = 0;
        }
    }
}

// Exportar para uso global
window.AudioSystem = AudioSystem;