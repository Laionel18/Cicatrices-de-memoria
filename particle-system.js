// particle-system.js - Sistema de partículas para efectos
class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.emitters = [];
        
        this.init();
    }

    init() {
        this.createParticlePool();
    }

    createParticlePool() {
        // Crear pool de partículas para reutilización
        this.particlePool = [];
        const poolSize = 100;
        
        for (let i = 0; i < poolSize; i++) {
            const geometry = new THREE.SphereGeometry(0.05, 4, 4);
            const material = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.7
            });
            const particle = new THREE.Mesh(geometry, material);
            particle.visible = false;
            this.scene.add(particle);
            this.particlePool.push(partible);
        }
    }

    createEmitter(type, position, options = {}) {
        const emitter = {
            type,
            position: position.clone(),
            active: true,
            particles: [],
            lifeTime: options.lifeTime || 2,
            startTime: performance.now(),
            options
        };
        
        this.emitters.push(emitter);
        return emitter;
    }

    update() {
        const currentTime = performance.now();
        
        // Actualizar emisores
        for (let i = this.emitters.length - 1; i >= 0; i--) {
            const emitter = this.emitters[i];
            
            // Verificar si el emisor expiró
            if (currentTime - emitter.startTime > emitter.lifeTime * 1000) {
                this.removeEmitter(i);
                continue;
            }
            
            // Emitir partículas según el tipo
            this.emitParticles(emitter, currentTime);
            
            // Actualizar partículas existentes
            this.updateParticles(emitter, currentTime);
        }
    }

    emitParticles(emitter, currentTime) {
        const emitRate = emitter.options.emitRate || 10;
        const timeSinceLastEmit = currentTime - (emitter.lastEmitTime || 0);
        
        if (timeSinceLastEmit > 1000 / emitRate) {
            emitter.lastEmitTime = currentTime;
            
            const count = emitter.options.burst ? 
                emitter.options.particleCount || 10 : 1;
            
            for (let i = 0; i < count; i++) {
                this.createParticle(emitter);
            }
        }
    }

    createParticle(emitter) {
        // Tomar partícula del pool
        const particle = this.particlePool.shift();
        if (!particle) return null;
        
        // Configurar según tipo de emisor
        switch(emitter.type) {
            case 'blood':
                this.setupBloodParticle(particle, emitter);
                break;
            case 'dust':
                this.setupDustParticle(particle, emitter);
                break;
            case 'spark':
                this.setupSparkParticle(particle, emitter);
                break;
            case 'smoke':
                this.setupSmokeParticle(particle, emitter);
                break;
        }
        
        particle.visible = true;
        emitter.particles.push({
            mesh: particle,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                Math.random() * 0.3,
                (Math.random() - 0.5) * 0.2
            ),
            life: 1,
            maxLife: 1 + Math.random() * 0.5
        });
        
        return particle;
    }

    setupBloodParticle(particle, emitter) {
        particle.material.color.setHex(0x8B0000);
        particle.scale.setScalar(0.3 + Math.random() * 0.3);
        particle.position.copy(emitter.position);
        
        // Velocidad inicial hacia arriba
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            2 + Math.random(),
            (Math.random() - 0.5) * 0.5
        );
        
        return velocity;
    }

    setupDustParticle(particle, emitter) {
        particle.material.color.setHex(0x888888);
        particle.scale.setScalar(0.1 + Math.random() * 0.1);
        particle.position.copy(emitter.position);
        
        // Velocidad lenta
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            Math.random() * 0.05,
            (Math.random() - 0.5) * 0.1
        );
        
        return velocity;
    }

    updateParticles(emitter, currentTime) {
        for (let i = emitter.particles.length - 1; i >= 0; i--) {
            const p = emitter.particles[i];
            p.life -= 0.016 / p.maxLife; // Asumiendo 60 FPS
            
            if (p.life <= 0) {
                // Devolver al pool
                p.mesh.visible = false;
                this.particlePool.push(p.mesh);
                emitter.particles.splice(i, 1);
                continue;
            }
            
            // Actualizar posición
            p.velocity.y -= 0.01; // Gravedad
            p.mesh.position.add(p.velocity);
            
            // Actualizar opacidad
            p.mesh.material.opacity = p.life * 0.7;
            
            // Actualizar escala
            p.mesh.scale.setScalar(p.life * 0.5);
        }
    }

    removeEmitter(index) {
        const emitter = this.emitters[index];
        
        // Devolver todas las partículas al pool
        emitter.particles.forEach(p => {
            p.mesh.visible = false;
            this.particlePool.push(p.mesh);
        });
        
        this.emitters.splice(index, 1);
    }

    // Efectos predefinidos
    createBloodSplash(position, intensity = 1) {
        const emitter = this.createEmitter('blood', position, {
            lifeTime: 1,
            emitRate: 30 * intensity,
            particleCount: Math.floor(10 * intensity),
            burst: true
        });
        
        return emitter;
    }

    createDustCloud(position, size = 1) {
        const emitter = this.createEmitter('dust', position, {
            lifeTime: 3,
            emitRate: 5,
            particleCount: Math.floor(20 * size)
        });
        
        return emitter;
    }

    createSparkEffect(position) {
        const emitter = this.createEmitter('spark', position, {
            lifeTime: 0.5,
            emitRate: 50,
            particleCount: 20,
            burst: true
        });
        
        return emitter;
    }

    createSmokeEffect(position) {
        const emitter = this.createEmitter('smoke', position, {
            lifeTime: 2,
            emitRate: 10,
            particleCount: 15
        });
        
        return emitter;
    }

    clearAll() {
        // Limpiar todos los emisores
        while (this.emitters.length > 0) {
            this.removeEmitter(0);
        }
    }
}

// Exportar para uso global
window.ParticleSystem = ParticleSystem;