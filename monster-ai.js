// monster-ai.js - IA del monstruo
class MonsterAI {
    constructor(monsterMesh, playerCamera) {
        this.monster = monsterMesh;
        this.player = playerCamera;
        this.state = 'IDLE'; // IDLE, PATROL, CHASE, ATTACK
        this.speed = 0.02;
        this.chaseSpeed = 0.04;
        this.detectionRange = 15;
        this.attackRange = 2;
        this.visionAngle = Math.PI / 3; // 60 grados
        
        this.patrolPoints = [];
        this.currentPatrolIndex = 0;
        this.lastKnownPosition = null;
        this.timeInState = 0;
        
        this.isActive = false;
        this.distanceToPlayer = 100;
        
        this.init();
    }

    init() {
        this.generatePatrolPoints();
        this.setupVisionCone();
    }

    generatePatrolPoints() {
        // Generar puntos de patrulla alrededor del área
        const numPoints = 6;
        const center = this.monster.position.clone();
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i * Math.PI * 2) / numPoints;
            const radius = 5 + Math.random() * 3;
            const point = new THREE.Vector3(
                center.x + Math.cos(angle) * radius,
                1,
                center.z + Math.sin(angle) * radius
            );
            this.patrolPoints.push(point);
        }
    }

    setupVisionCone() {
        // Crear cono de visión (para debug)
        const coneGeometry = new THREE.ConeGeometry(1, 3, 8);
        const coneMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, 
            transparent: true, 
            opacity: 0.2 
        });
        this.visionCone = new THREE.Mesh(coneGeometry, coneMaterial);
        this.visionCone.rotation.x = Math.PI / 2;
        this.monster.add(this.visionCone);
        this.visionCone.visible = false; // Oculto en producción
    }

    update() {
        if (!this.isActive) return;
        
        this.timeInState += 0.016; // Aprox. 60 FPS
        
        // Calcular distancia al jugador
        this.distanceToPlayer = this.monster.position.distanceTo(this.player.position);
        
        // Actualizar estado basado en condiciones
        this.updateState();
        
        // Ejecutar comportamiento según estado
        switch(this.state) {
            case 'IDLE':
                this.idleBehavior();
                break;
            case 'PATROL':
                this.patrolBehavior();
                break;
            case 'CHASE':
                this.chaseBehavior();
                break;
            case 'ATTACK':
                this.attackBehavior();
                break;
        }
        
        // Comportamiento impredecible
        this.randomBehavior();
        
        // Actualizar shader de distorsión
        this.updateDistortion();
    }

    updateState() {
        const canSeePlayer = this.canSeePlayer();
        const canHearPlayer = this.canHearPlayer();
        
        switch(this.state) {
            case 'IDLE':
                if (canSeePlayer || canHearPlayer) {
                    this.setState('CHASE');
                } else if (this.timeInState > 3) {
                    this.setState('PATROL');
                }
                break;
                
            case 'PATROL':
                if (canSeePlayer || canHearPlayer) {
                    this.setState('CHASE');
                }
                break;
                
            case 'CHASE':
                if (!canSeePlayer && this.timeInState > 5) {
                    this.setState('PATROL');
                } else if (this.distanceToPlayer <= this.attackRange) {
                    this.setState('ATTACK');
                }
                break;
                
            case 'ATTACK':
                if (this.distanceToPlayer > this.attackRange) {
                    this.setState('CHASE');
                } else if (this.timeInState > 1) {
                    // Volver a perseguir después de atacar
                    this.setState('CHASE');
                }
                break;
        }
    }

    idleBehavior() {
        // Girar lentamente
        this.monster.rotation.y += 0.01;
    }

    patrolBehavior() {
        if (this.patrolPoints.length === 0) return;
        
        const targetPoint = this.patrolPoints[this.currentPatrolIndex];
        const direction = new THREE.Vector3();
        direction.subVectors(targetPoint, this.monster.position).normalize();
        
        // Mover hacia el punto
        this.monster.position.add(direction.multiplyScalar(this.speed));
        
        // Rotar hacia la dirección
        if (direction.length() > 0.1) {
            this.monster.lookAt(
                this.monster.position.x + direction.x,
                this.monster.position.y,
                this.monster.position.z + direction.z
            );
        }
        
        // Verificar si llegó al punto
        if (this.monster.position.distanceTo(targetPoint) < 1) {
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
            this.timeInState = 0;
        }
    }

    chaseBehavior() {
        if (!this.lastKnownPosition) {
            this.lastKnownPosition = this.player.position.clone();
        }
        
        const direction = new THREE.Vector3();
        direction.subVectors(this.lastKnownPosition, this.monster.position).normalize();
        
        // Mover hacia el jugador
        const currentSpeed = this.canSeePlayer() ? this.chaseSpeed : this.speed;
        this.monster.position.add(direction.multiplyScalar(currentSpeed));
        
        // Rotar hacia el jugador
        if (direction.length() > 0.1) {
            this.monster.lookAt(
                this.monster.position.x + direction.x,
                this.monster.position.y,
                this.monster.position.z + direction.z
            );
        }
        
        // Actualizar última posición conocida
        if (this.canSeePlayer()) {
            this.lastKnownPosition.copy(this.player.position);
        }
    }

    attackBehavior() {
        // Ataque al jugador
        this.timeInState = 0;
        
        // Aquí se activaría el daño al jugador
        // y efectos visuales/sonoros
    }

    canSeePlayer() {
        // Verificar si el jugador está dentro del rango
        if (this.distanceToPlayer > this.detectionRange) {
            return false;
        }
        
        // Verificar si está dentro del cono de visión
        const monsterForward = new THREE.Vector3(0, 0, -1);
        monsterForward.applyQuaternion(this.monster.quaternion);
        
        const toPlayer = new THREE.Vector3();
        toPlayer.subVectors(this.player.position, this.monster.position).normalize();
        
        const angle = monsterForward.angleTo(toPlayer);
        
        if (angle > this.visionAngle) {
            return false;
        }
        
        // Raycast para verificar obstáculos
        const raycaster = new THREE.Raycaster();
        raycaster.set(this.monster.position, toPlayer);
        
        // Aquí deberíamos verificar colisiones con el entorno
        // Por simplicidad, asumimos línea de visión directa
        
        return true;
    }

    canHearPlayer() {
        // Detección por sonido
        // El jugador hace más ruido cuando:
        // - Corre (speed > normal)
        // - Usa la linterna
        // - Interactúa con objetos
        
        return this.distanceToPlayer < 8; // Rango de audición
    }

    randomBehavior() {
        // Comportamiento impredecible
        if (Math.random() < 0.001) { // 0.1% de chance por frame
            this.randomTeleport();
        }
        
        if (Math.random() < 0.005) { // 0.5% de chance por frame
            this.randomStateChange();
        }
    }

    randomTeleport() {
        if (this.state === 'CHASE' || this.state === 'ATTACK') return;
        
        // Teletransporte aleatorio
        const angle = Math.random() * Math.PI * 2;
        const distance = 5 + Math.random() * 10;
        const newPosition = new THREE.Vector3(
            this.player.position.x + Math.cos(angle) * distance,
            1,
            this.player.position.z + Math.sin(angle) * distance
        );
        
        this.monster.position.copy(newPosition);
    }

    randomStateChange() {
        const states = ['IDLE', 'PATROL'];
        const newState = states[Math.floor(Math.random() * states.length)];
        
        if (newState !== this.state) {
            this.setState(newState);
        }
    }

    setState(newState) {
        if (this.state === newState) return;
        
        this.state = newState;
        this.timeInState = 0;
        
        // Efectos al cambiar de estado
        switch(newState) {
            case 'CHASE':
                this.onChaseStart();
                break;
            case 'ATTACK':
                this.onAttackStart();
                break;
        }
    }

    onChaseStart() {
        // Sonido de detección
        console.log('Monstruo detectó al jugador');
        
        // Efecto visual
        if (window.shaderEffects) {
            window.shaderEffects.triggerStaticEffect(100);
        }
    }

    onAttackStart() {
        // Sonido de ataque
        console.log('Monstruo atacando');
        
        // Efecto visual
        if (window.shaderEffects) {
            window.shaderEffects.triggerBloodEffect();
        }
    }

    updateDistortion() {
        // Actualizar shader de distorsión basado en distancia
        if (this.monster.material && this.monster.material.uniforms) {
            const distortion = Math.max(0, 1 - (this.distanceToPlayer / 20));
            this.monster.material.uniforms.distortion.value = distortion;
        }
        
        // Actualizar efectos de pantalla
        if (window.shaderEffects) {
            window.shaderEffects.updateMonsterDistortion(this.distanceToPlayer);
        }
    }

    activate() {
        this.isActive = true;
        this.monster.visible = true;
        this.setState('PATROL');
    }

    deactivate() {
        this.isActive = false;
        this.monster.visible = false;
        this.setState('IDLE');
    }

    getPosition() {
        return this.monster.position.clone();
    }

    isPlayerInAttackRange() {
        return this.distanceToPlayer <= this.attackRange;
    }
}

// Exportar para uso global
window.MonsterAI = MonsterAI;