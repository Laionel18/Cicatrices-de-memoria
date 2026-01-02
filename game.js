u// game.js - Juego de Terror 3D con Three.js
class CicatricesDeMemoria {
    constructor() {
        // Estado del juego
        this.gameState = {
            photosFound: 0,
            totalPhotos: 5,
            flashlightBattery: 100,
            monsterActive: false,
            flashlightOn: false,
            monsterDistance: 100,
            playerHealth: 100,
            gameOver: false,
            gameStarted: false
        };

        // Referencias Three.js
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // Elementos del juego
        this.player = null;
        this.monster = null;
        this.photos = [];
        this.walls = [];
        this.flashlight = null;
        
        // Audio
        this.audioContext = null;
        this.audioBuffers = {};
        
        // Inicializar
        this.init();
    }

    init() {
        // Crear escena
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000000, 1, 50);

        // Crear cámara FPS
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 1.6, 5);

        // Crear renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // Controles
        this.setupControls();
        
        // Luces
        this.setupLights();
        
        // Generar entorno
        this.generateEnvironment();
        
        // Crear monstruo
        this.createMonster();
        
        // Crear fotos
        this.createPhotos();
        
        // Iniciar audio
        this.setupAudio();
        
        // Iniciar UI
        this.setupUI();
        
        // Iniciar loop del juego
        this.animate();
        
        // Event listeners
        this.setupEventListeners();
        
        // Iniciar temporizadores
        this.startGameTimers();
    }

    setupControls() {
        // Movimiento con teclado
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.lookSpeed = 0.002;
        this.moveSpeed = 0.1;
        this.cameraRotation = { x: 0, y: 0 };
        
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // Tecla F para linterna
            if (e.key === 'f' || e.key === 'F') {
                this.toggleFlashlight();
            }
            
            // Tecla E para interactuar
            if (e.key === 'e' || e.key === 'E') {
                this.checkInteraction();
            }
            
            // Tecla R para reiniciar
            if (e.key === 'r' || e.key === 'R') {
                this.restartGame();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Mouse look
        document.addEventListener('mousemove', (e) => {
            if (!this.gameState.gameStarted) return;
            
            this.mouse.x = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
            this.mouse.y = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
            
            this.cameraRotation.y -= this.mouse.x * this.lookSpeed;
            this.cameraRotation.x -= this.mouse.y * this.lookSpeed;
            this.cameraRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.cameraRotation.x));
            
            this.camera.rotation.set(this.cameraRotation.x, this.cameraRotation.y, 0);
        });
        
        // Bloquear cursor para FPS
        this.renderer.domElement.addEventListener('click', () => {
            if (!this.gameState.gameStarted) return;
            this.renderer.domElement.requestPointerLock();
        });
    }

    setupLights() {
        // Luz ambiental tenue
        const ambientLight = new THREE.AmbientLight(0x222222, 0.3);
        this.scene.add(ambientLight);
        
        // Luz direccional (como luna)
        const directionalLight = new THREE.DirectionalLight(0x445588, 0.2);
        directionalLight.position.set(10, 20, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Linterna (SpotLight)
        this.flashlight = new THREE.SpotLight(0xffeedd, 2, 30, Math.PI/4, 0.5, 1);
        this.flashlight.position.set(0, 0, 0);
        this.flashlight.castShadow = true;
        this.flashlight.shadow.mapSize.width = 1024;
        this.flashlight.shadow.mapSize.height = 1024;
        this.camera.add(this.flashlight);
        this.flashlight.visible = false;
    }

    generateEnvironment() {
        // Piso
        const floorGeometry = new THREE.PlaneGeometry(50, 50);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // Paredes del apartamento
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x555555,
            roughness: 0.9,
            metalness: 0
        });
        
        // Paredes en forma de habitación
        const walls = [
            // Norte
            { pos: [0, 2.5, -10], size: [20, 5, 0.2] },
            // Sur
            { pos: [0, 2.5, 10], size: [20, 5, 0.2] },
            // Este
            { pos: [10, 2.5, 0], size: [0.2, 5, 20] },
            // Oeste
            { pos: [-10, 2.5, 0], size: [0.2, 5, 20] }
        ];
        
        walls.forEach(wallData => {
            const wallGeometry = new THREE.BoxGeometry(...wallData.size);
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);
            wall.position.set(...wallData.pos);
            wall.castShadow = true;
            wall.receiveShadow = true;
            this.scene.add(wall);
            this.walls.push(wall);
        });
        
        // Techo
        const ceilingGeometry = new THREE.PlaneGeometry(20, 20);
        const ceilingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            roughness: 0.9
        });
        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.position.y = 5;
        ceiling.rotation.x = Math.PI / 2;
        ceiling.receiveShadow = true;
        this.scene.add(ceiling);
        
        // Muebles procedurales
        this.generateFurniture();
    }

    generateFurniture() {
        const furnitureTypes = [
            { type: 'box', size: [2, 1, 1], color: 0x8B4513 },
            { type: 'box', size: [1, 2, 0.5], color: 0x654321 },
            { type: 'cylinder', radius: 0.5, height: 1, color: 0x333333 }
        ];
        
        const positions = [
            [-6, 0.5, -6],
            [6, 0.5, -6],
            [-6, 0.5, 6],
            [6, 0.5, 6],
            [0, 0.5, -8],
            [0, 0.5, 8]
        ];
        
        positions.forEach((pos, i) => {
            const type = furnitureTypes[i % furnitureTypes.length];
            let geometry;
            
            if (type.type === 'box') {
                geometry = new THREE.BoxGeometry(...type.size);
            } else {
                geometry = new THREE.CylinderGeometry(type.radius, type.radius, type.height);
            }
            
            const material = new THREE.MeshStandardMaterial({ 
                color: type.color,
                roughness: 0.8
            });
            
            const furniture = new THREE.Mesh(geometry, material);
            furniture.position.set(...pos);
            furniture.castShadow = true;
            furniture.receiveShadow = true;
            this.scene.add(furniture);
        });
    }

    createMonster() {
        // Geometría del monstruo (esfera distorsionada)
        const monsterGeometry = new THREE.SphereGeometry(1, 32, 32);
        
        // Shader personalizado para el monstruo
        const monsterMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                distortion: { value: 0 },
                color: { value: new THREE.Color(0x220000) }
            },
            vertexShader: `
                uniform float time;
                uniform float distortion;
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                void main() {
                    vPosition = position;
                    vNormal = normal;
                    
                    // Distorsión procedural
                    float wave = sin(position.x * 10.0 + time) * 
                                 sin(position.y * 8.0 + time * 1.2) * 
                                 sin(position.z * 12.0 + time * 0.8);
                    
                    vec3 newPosition = position + normal * wave * distortion * 0.3;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                void main() {
                    // Efecto "anti-materia"
                    vec3 viewDir = normalize(-vPosition);
                    float fresnel = 1.0 - dot(vNormal, viewDir);
                    fresnel = pow(fresnel, 3.0);
                    
                    // Patrón procedural
                    float pattern = sin(vPosition.x * 5.0) * 
                                   cos(vPosition.y * 4.0) * 
                                   sin(vPosition.z * 6.0);
                    
                    vec3 finalColor = color;
                    finalColor.r += pattern * 0.3;
                    finalColor.g += sin(vPosition.y * 3.0) * 0.1;
                    
                    // Emisión basada en fresnel
                    float emission = fresnel * 0.5 + 0.3;
                    
                    gl_FragColor = vec4(finalColor * emission, 0.9);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        this.monster = new THREE.Mesh(monsterGeometry, monsterMaterial);
        this.monster.position.set(15, 1, 15);
        this.monster.castShadow = true;
        this.scene.add(this.monster);
    }

    createPhotos() {
        // Crear 5 fotos quemadas en posiciones aleatorias
        const photoPositions = [
            [-7, 1.5, -7],
            [7, 1.5, -7],
            [-7, 1.5, 7],
            [7, 1.5, 7],
            [0, 1.5, 0]
        ];
        
        photoPositions.forEach((pos, index) => {
            // Crear marco de foto
            const frameGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.05);
            const frameMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x8B4513,
                roughness: 0.7
            });
            const frame = new THREE.Mesh(frameGeometry, frameMaterial);
            frame.position.set(...pos);
            frame.rotation.y = Math.random() * Math.PI;
            frame.castShadow = true;
            
            // Crear foto quemada
            const photoGeometry = new THREE.PlaneGeometry(0.5, 0.3);
            const photoMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    burnAmount: { value: 0.7 },
                    photoId: { value: index }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform float burnAmount;
                    uniform int photoId;
                    varying vec2 vUv;
                    
                    float random(vec2 st) {
                        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                    }
                    
                    void main() {
                        vec2 uv = vUv;
                        
                        // Patrón de quemado
                        float burn = distance(uv, vec2(0.5)) * 2.0;
                        burn = smoothstep(0.0, 1.0, burn);
                        
                        // Agujeros quemados
                        float holes = 0.0;
                        for(int i = 0; i < 5; i++) {
                            vec2 holePos = vec2(
                                random(vec2(float(i) * 1.23, 0.0)),
                                random(vec2(float(i) * 2.34, 1.0))
                            );
                            float holeSize = random(vec2(float(i) * 3.45, 2.0)) * 0.1;
                            float dist = distance(uv, holePos);
                            holes += 1.0 - smoothstep(holeSize * 0.8, holeSize, dist);
                        }
                        holes = clamp(holes, 0.0, 1.0);
                        
                        // Imagen de foto basada en ID
                        float pattern = sin(uv.x * 20.0 + float(photoId) * 3.1415) * 
                                       cos(uv.y * 15.0 + float(photoId) * 1.618);
                        
                        // Color de foto quemada
                        vec3 photoColor = mix(
                            vec3(0.9, 0.8, 0.7), // Original
                            vec3(0.3, 0.2, 0.1), // Quemado
                            burn * burnAmount
                        );
                        
                        // Aplicar agujeros
                        photoColor = mix(photoColor, vec3(0.1, 0.05, 0.02), holes * 0.5);
                        
                        // Variación de color
                        photoColor *= 0.8 + 0.4 * pattern;
                        
                        // Brillo tenue
                        float glow = (1.0 - burn) * 0.1;
                        
                        gl_FragColor = vec4(photoColor + vec3(glow), 1.0);
                    }
                `
            });
            
            const photo = new THREE.Mesh(photoGeometry, photoMaterial);
            photo.position.set(0, 0, 0.026);
            frame.add(photo);
            
            // Guardar referencia
            frame.userData = {
                type: 'photo',
                id: index,
                collected: false
            };
            
            this.scene.add(frame);
            this.photos.push(frame);
        });
    }

    setupAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Generar sonidos procedurales
            this.generateSounds();
            
        } catch (e) {
            console.log('Audio no soportado:', e);
        }
    }

    generateSounds() {
        // Sonidos ambientales procedurales
        this.ambientSounds = {
            wind: this.createWindSound(),
            heartbeat: this.createHeartbeatSound(),
            whispers: this.createWhisperSound()
        };
        
        // Sonidos de pasos
        this.stepSound = this.createStepSound();
        
        // Sonidos de terror
        this.scarySounds = [
            this.createScarySound1(),
            this.createScarySound2(),
            this.createScarySound3()
        ];
    }

    createWindSound() {
        if (!this.audioContext) return null;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 80;
        
        // Modulación para sonido de viento
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        
        lfo.frequency.value = 0.5;
        lfoGain.gain.value = 20;
        
        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);
        
        // Ganancia variable
        gainNode.gain.value = 0.02;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        lfo.start();
        
        return { oscillator, gainNode, lfo };
    }

    createStepSound() {
        // Generador de sonido de paso
        return {
            play: () => {
                if (!this.audioContext) return;
                
                const now = this.audioContext.currentTime;
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.frequency.value = 300;
                gainNode.gain.value = 0.1;
                
                // Envolvente ADSR
                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(0.1, now + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.start(now);
                oscillator.stop(now + 0.2);
            }
        };
    }

    setupUI() {
        // Mostrar mensaje inicial
        this.showMessage('Encuentra las 5 fotos quemadas', 3000);
        
        // Actualizar HUD
        this.updateHUD();
    }

    updateHUD() {
        document.getElementById('photo-count').textContent = 
            `${this.gameState.photosFound}/${this.gameState.totalPhotos}`;
        
        document.getElementById('battery-fill').style.width = 
            `${this.gameState.flashlightBattery}%`;
        
        // Cambiar color de batería
        const batteryFill = document.getElementById('battery-fill');
        if (this.gameState.flashlightBattery > 50) {
            batteryFill.style.background = 'linear-gradient(90deg, #00ff00, #ffff00)';
        } else if (this.gameState.flashlightBattery > 20) {
            batteryFill.style.background = 'linear-gradient(90deg, #ffff00, #ff9900)';
        } else {
            batteryFill.style.background = 'linear-gradient(90deg, #ff9900, #ff0000)';
        }
    }

    showMessage(text, duration = 3000) {
        const messageBox = document.getElementById('message-box');
        const messageText = document.getElementById('message-text');
        
        messageText.textContent = text;
        messageBox.style.display = 'block';
        
        if (duration > 0) {
            setTimeout(() => {
                messageBox.style.display = 'none';
            }, duration);
        }
    }

    toggleFlashlight() {
        if (this.gameState.flashlightBattery <= 0) {
            this.showMessage('¡Batería agotada!', 2000);
            return;
        }
        
        this.gameState.flashlightOn = !this.gameState.flashlightOn;
        this.flashlight.visible = this.gameState.flashlightOn;
        
        if (this.gameState.flashlightOn) {
            // Iniciar consumo de batería
            this.startBatteryConsumption();
        }
    }

    startBatteryConsumption() {
        if (this.batteryInterval) clearInterval(this.batteryInterval);
        
        this.batteryInterval = setInterval(() => {
            if (this.gameState.flashlightOn && this.gameState.flashlightBattery > 0) {
                this.gameState.flashlightBattery -= 0.5;
                this.updateHUD();
                
                // Batería crítica
                if (this.gameState.flashlightBattery <= 20) {
                    this.flashlight.intensity = 1 + (this.gameState.flashlightBattery / 20);
                    this.flashlight.color.setHex(0xff6600);
                }
                
                // Apagar linterna si se acaba la batería
                if (this.gameState.flashlightBattery <= 0) {
                    this.gameState.flashlightOn = false;
                    this.flashlight.visible = false;
                    clearInterval(this.batteryInterval);
                    this.showMessage('La linterna se apagó', 2000);
                }
                
                // Spawnear monstruo después de 30 segundos
                if (this.gameState.flashlightBattery <= 70 && !this.gameState.monsterActive) {
                    this.spawnMonster();
                }
            } else {
                clearInterval(this.batteryInterval);
            }
        }, 100);
    }

    spawnMonster() {
        this.gameState.monsterActive = true;
        this.showMessage('¡Algo te escuchó!', 2000);
        
        // Posicionar monstruo cerca
        const angle = Math.random() * Math.PI * 2;
        const distance = 10 + Math.random() * 5;
        this.monster.position.set(
            Math.cos(angle) * distance,
            1,
            Math.sin(angle) * distance
        );
        
        // Hacer visible al monstruo
        this.monster.visible = true;
        
        // Iniciar IA del monstruo
        this.startMonsterAI();
    }

    startMonsterAI() {
        // Movimiento del monstruo hacia el jugador
        const monsterAI = () => {
            if (!this.gameState.monsterActive || this.gameState.gameOver) return;
            
            // Calcular dirección al jugador
            const direction = new THREE.Vector3();
            direction.subVectors(this.camera.position, this.monster.position).normalize();
            
            // Mover monstruo
            const speed = 0.02 + (this.gameState.monsterDistance < 5 ? 0.03 : 0);
            this.monster.position.add(direction.multiplyScalar(speed));
            
            // Rotar hacia el jugador
            this.monster.lookAt(this.camera.position);
            
            // Actualizar distancia
            this.gameState.monsterDistance = this.monster.position.distanceTo(this.camera.position);
            
            // Verificar ataque
            if (this.gameState.monsterDistance < 2) {
                this.monsterAttack();
            }
            
            // Efectos de shader según distancia
            const distortion = Math.max(0, 1 - (this.gameState.monsterDistance / 15));
            this.monster.material.uniforms.distortion.value = distortion;
            
            // Continuar AI
            requestAnimationFrame(monsterAI);
        };
        
        monsterAI();
    }

    monsterAttack() {
        if (this.gameState.gameOver) return;
        
        // Reducir salud del jugador
        this.gameState.playerHealth -= 10;
        
        // Efecto visual de ataque
        this.screenShake(0.5);
        this.showBloodEffect();
        
        // Verificar game over
        if (this.gameState.playerHealth <= 0) {
            this.gameOver('El monstruo te alcanzó');
        } else {
            this.showMessage('¡Te atacó!', 1000);
        }
    }

    checkInteraction() {
        // Raycast para detectar objetos interactuables
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        
        const intersects = raycaster.intersectObjects(this.photos);
        
        if (intersects.length > 0) {
            const photo = intersects[0].object;
            
            if (!photo.userData.collected) {
                // Recolectar foto
                photo.userData.collected = true;
                this.gameState.photosFound++;
                
                // Efecto visual
                photo.visible = false;
                
                // Sonido
                if (this.stepSound) this.stepSound.play();
                
                // Actualizar UI
                this.updateHUD();
                this.showMessage(`¡Foto encontrada! (${this.gameState.photosFound}/5)`, 2000);
                
                // Verificar si se encontraron todas las fotos
                if (this.gameState.photosFound >= this.gameState.totalPhotos) {
                    this.gameWin();
                }
            }
        }
    }

    gameWin() {
        this.gameState.gameOver = true;
        
        // Revelar plot twist
        setTimeout(() => {
            this.showMessage('PLOT TWIST: Tú provocaste el incendio familiar', 5000);
        }, 1000);
        
        // Mostrar pantalla de victoria
        setTimeout(() => {
            this.showGameOver('¡MEMORIA RECUPERADA! Has descubierto la verdad...');
        }, 6000);
    }

    gameOver(reason) {
        this.gameState.gameOver = true;
        this.showGameOver(reason);
    }

    showGameOver(reason) {
        document.getElementById('game-over-reason').textContent = reason;
        document.getElementById('game-over-screen').style.display = 'flex';
        document.getElementById('game-hud').style.display = 'none';
    }

    restartGame() {
        // Resetear estado
        this.gameState = {
            photosFound: 0,
            totalPhotos: 5,
            flashlightBattery: 100,
            monsterActive: false,
            flashlightOn: false,
            monsterDistance: 100,
            playerHealth: 100,
            gameOver: false,
            gameStarted: true
        };
        
        // Resetear objetos
        this.photos.forEach(photo => {
            photo.visible = true;
            photo.userData.collected = false;
        });
        
        // Ocultar monstruo
        this.monster.visible = false;
        this.monster.position.set(15, 1, 15);
        
        // Apagar linterna
        this.flashlight.visible = false;
        
        // Resetear cámara
        this.camera.position.set(0, 1.6, 5);
        this.camera.rotation.set(0, 0, 0);
        this.cameraRotation = { x: 0, y: 0 };
        
        // Ocultar pantalla game over
        document.getElementById('game-over-screen').style.display = 'none';
        document.getElementById('game-hud').style.display = 'block';
        
        // Actualizar UI
        this.updateHUD();
        this.showMessage('Juego reiniciado', 2000);
        
        // Iniciar juego
        this.gameState.gameStarted = true;
        document.getElementById('loading-screen').style.display = 'none';
    }

    screenShake(intensity = 0.1) {
        const originalPos = this.camera.position.clone();
        
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                this.camera.position.x = originalPos.x + (Math.random() - 0.5) * intensity;
                this.camera.position.y = originalPos.y + (Math.random() - 0.5) * intensity;
            }, i * 50);
        }
        
        setTimeout(() => {
            this.camera.position.copy(originalPos);
        }, 500);
    }

    showBloodEffect() {
        const bloodEffect = document.getElementById('blood-effect');
        if (!bloodEffect) return;
        
        bloodEffect.style.opacity = '0.3';
        
        setTimeout(() => {
            bloodEffect.style.opacity = '0';
        }, 500);
    }

    startGameTimers() {
        // Jumpscares programados
        setTimeout(() => {
            if (!this.gameState.gameOver) {
                this.triggerJumpScare('static');
            }
        }, 15000);
        
        setTimeout(() => {
            if (!this.gameState.gameOver) {
                this.triggerJumpScare('noise');
            }
        }, 45000);
        
        setTimeout(() => {
            if (!this.gameState.gameOver) {
                this.triggerJumpScare('face');
            }
        }, 75000);
        
        // Eventos sonoros aleatorios
        setInterval(() => {
            if (!this.gameState.gameOver && Math.random() < 0.1) {
                this.playRandomScarySound();
            }
        }, 30000);
    }

    triggerJumpScare(type) {
        switch(type) {
            case 'static':
                // Efecto de estática de TV
                const staticEffect = document.getElementById('static-effect');
                if (staticEffect) {
                    staticEffect.style.display = 'block';
                    setTimeout(() => {
                        staticEffect.style.display = 'none';
                    }, 300);
                }
                break;
                
            case 'noise':
                // Sonido fuerte
                if (this.scarySounds[0]) {
                    // Aquí se reproduciría el sonido
                }
                break;
                
            case 'face':
                // Cara apareciendo
                const faceEffect = document.getElementById('face-effect');
                if (faceEffect) {
                    faceEffect.style.display = 'block';
                    setTimeout(() => {
                        faceEffect.style.display = 'none';
                    }, 1000);
                }
                break;
        }
        
        // Screen shake
        this.screenShake(0.2);
    }

    playRandomScarySound() {
        // Reproducir sonido aleatorio
        console.log('Sonido de terror reproducido');
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.gameState.gameOver || !this.gameState.gameStarted) return;
        
        // Actualizar tiempo para shaders
        const time = performance.now() * 0.001;
        
        // Actualizar shader del monstruo
        if (this.monster && this.monster.material) {
            this.monster.material.uniforms.time.value = time;
        }
        
        // Actualizar shaders de fotos
        this.photos.forEach(photo => {
            const photoMesh = photo.children[0];
            if (photoMesh && photoMesh.material) {
                photoMesh.material.uniforms.time.value = time;
            }
        });
        
        // Movimiento del jugador
        this.updatePlayerMovement();
        
        // Renderizar
        this.renderer.render(this.scene, this.camera);
    }

    updatePlayerMovement() {
        if (!this.gameState.gameStarted) return;
        
        const moveVector = new THREE.Vector3();
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        
        // Obtener dirección de la cámara
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
        
        // Movimiento basado en teclas
        if (this.keys['w']) moveVector.add(forward);
        if (this.keys['s']) moveVector.sub(forward);
        if (this.keys['a']) moveVector.sub(right);
        if (this.keys['d']) moveVector.add(right);
        
        // Normalizar y aplicar velocidad
        if (moveVector.length() > 0) {
            moveVector.normalize();
            const speed = this.keys['shift'] ? this.moveSpeed * 1.5 : this.moveSpeed;
            moveVector.multiplyScalar(speed);
            
            // Mover cámara
            this.camera.position.add(moveVector);
            
            // Sonido de pasos
            if (!this.stepCooldown) {
                if (this.stepSound) this.stepSound.play();
                this.stepCooldown = true;
                setTimeout(() => {
                    this.stepCooldown = false;
                }, 500);
            }
        }
    }

    setupEventListeners() {
        // Redimensionar ventana
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Iniciar juego al hacer clic
        document.getElementById('start-btn')?.addEventListener('click', () => {
            this.gameState.gameStarted = true;
            document.getElementById('loading-screen').style.display = 'none';
            this.showMessage('Encuentra las 5 fotos quemadas', 3000);
        });
    }
}

// Iniciar juego cuando la página cargue
window.addEventListener('DOMContentLoaded', () => {
    window.game = new CicatricesDeMemoria();
});