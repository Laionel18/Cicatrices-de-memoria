// ui-manager.js - Gestor de interfaz de usuario
class UIManager {
    constructor(game) {
        this.game = game;
        this.elements = {};
        this.mobileControls = {};
        this.isMobile = false;
        
        this.init();
    }

    init() {
        this.detectPlatform();
        this.createUIElements();
        this.setupEventListeners();
        this.updateHUD();
    }

    detectPlatform() {
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (this.isMobile) {
            this.setupMobileControls();
        }
    }

    createUIElements() {
        // Crear elementos de HUD si no existen
        this.createHUD();
        
        // Crear controles móviles si es necesario
        if (this.isMobile) {
            this.createMobileControls();
        }
        
        // Crear efectos de pantalla
        this.createScreenEffects();
    }

    createHUD() {
        // Contenedor principal del HUD
        const hud = document.createElement('div');
        hud.id = 'game-hud';
        hud.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            right: 20px;
            z-index: 100;
            pointer-events: none;
        `;
        document.body.appendChild(hud);
        
        // Contador de fotos
        const photosDiv = document.createElement('div');
        photosDiv.className = 'hud-item';
        photosDiv.innerHTML = `
            <strong>FOTOS:</strong> <span id="photo-count">0/5</span>
        `;
        hud.appendChild(photosDiv);
        
        // Batería
        const batteryDiv = document.createElement('div');
        batteryDiv.className = 'hud-item';
        batteryDiv.innerHTML = `
            <strong>BATERÍA:</strong>
            <div class="battery-container">
                <div class="battery-bar">
                    <div class="battery-fill" id="battery-fill"></div>
                </div>
                <span class="battery-text" id="battery-text">100%</span>
            </div>
        `;
        hud.appendChild(batteryDiv);
        
        // Mensajes
        const messageDiv = document.createElement('div');
        messageDiv.id = 'message-box';
        messageDiv.className = 'hud-item';
        messageDiv.innerHTML = `
            <span id="message-text"></span>
        `;
        messageDiv.style.display = 'none';
        hud.appendChild(messageDiv);
        
        // Salud
        const healthDiv = document.createElement('div');
        healthDiv.className = 'hud-item';
        healthDiv.innerHTML = `
            <strong>SALUD:</strong>
            <div class="health-bar">
                <div class="health-fill" id="health-fill"></div>
            </div>
        `;
        hud.appendChild(healthDiv);
        
        // Guardar referencias
        this.elements.hud = hud;
        this.elements.photoCount = document.getElementById('photo-count');
        this.elements.batteryFill = document.getElementById('battery-fill');
        this.elements.batteryText = document.getElementById('battery-text');
        this.elements.messageBox = messageDiv;
        this.elements.messageText = document.getElementById('message-text');
        this.elements.healthFill = document.getElementById('health-fill');
    }

    createMobileControls() {
        const controlsContainer = document.createElement('div');
        controlsContainer.id = 'mobile-controls';
        controlsContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            width: 100%;
            display: flex;
            justify-content: space-between;
            padding: 0 20px;
            z-index: 100;
            pointer-events: none;
        `;
        document.body.appendChild(controlsContainer);
        
        // Joystick
        const joystick = document.createElement('div');
        joystick.id = 'mobile-joystick';
        joystick.className = 'mobile-joystick';
        joystick.innerHTML = '<div class="joystick-knob"></div>';
        joystick.style.pointerEvents = 'auto';
        controlsContainer.appendChild(joystick);
        
        // Botones
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'mobile-buttons';
        buttonsContainer.style.pointerEvents = 'auto';
        
        const buttons = [
            { id: 'flashlight-btn', label: 'F', text: 'Linterna' },
            { id: 'interact-btn', label: 'E', text: 'Interactuar' },
            { id: 'jump-btn', label: '⬆', text: 'Saltar' },
            { id: 'run-btn', label: '🏃', text: 'Correr' }
        ];
        
        buttons.forEach(btn => {
            const button = document.createElement('div');
            button.id = btn.id;
            button.className = 'mobile-button';
            button.innerHTML = `
                <span>${btn.label}</span>
                <span>${btn.text}</span>
            `;
            buttonsContainer.appendChild(button);
        });
        
        controlsContainer.appendChild(buttonsContainer);
        
        // Configurar controles táctiles
        this.setupTouchControls(joystick);
        this.setupMobileButtons();
        
        this.elements.mobileControls = controlsContainer;
    }

    setupTouchControls(joystick) {
        let isDragging = false;
        let joystickPos = { x: 0, y: 0 };
        const joystickRadius = 75;
        
        joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDragging = true;
            this.updateJoystick(e.touches[0], joystick, joystickRadius);
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            this.updateJoystick(e.touches[0], joystick, joystickRadius);
        });
        
        document.addEventListener('touchend', () => {
            isDragging = false;
            this.resetJoystick(joystick);
        });
    }

    updateJoystick(touch, joystick, radius) {
        const rect = joystick.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = touch.clientX - centerX;
        const deltaY = touch.clientY - centerY;
        
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        let moveX = deltaX;
        let moveY = deltaY;
        
        if (distance > radius) {
            moveX = (deltaX / distance) * radius;
            moveY = (deltaY / distance) * radius;
        }
        
        // Mover joystick visualmente
        joystick.style.transform = `translate(${moveX}px, ${moveY}px)`;
        
        // Calcular input normalizado
        const inputX = moveX / radius;
        const inputY = moveY / radius;
        
        // Enviar input al juego
        this.sendJoystickInput(inputX, inputY);
    }

    resetJoystick(joystick) {
        joystick.style.transform = 'translate(0, 0)';
        this.sendJoystickInput(0, 0);
    }

    sendJoystickInput(x, y) {
        // Simular teclas según dirección
        if (Math.abs(x) > 0.1) {
            if (x > 0) {
                this.simulateKey('d', Math.abs(x));
            } else {
                this.simulateKey('a', Math.abs(x));
            }
        }
        
        if (Math.abs(y) > 0.1) {
            if (y > 0) {
                this.simulateKey('s', Math.abs(y));
            } else {
                this.simulateKey('w', Math.abs(y));
            }
        }
    }

    simulateKey(key, intensity = 1) {
        // Simular presión de tecla
        if (this.game && this.game.keys) {
            this.game.keys[key] = true;
            // Podríamos usar intensity para variar la velocidad
        }
    }

    setupMobileButtons() {
        // Botón de linterna
        document.getElementById('flashlight-btn')?.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.simulateKeyPress('f');
        });
        
        // Botón de interacción
        document.getElementById('interact-btn')?.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.simulateKeyPress('e');
        });
        
        // Botón de salto
        document.getElementById('jump-btn')?.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.simulateKeyPress(' ');
        });
        
        // Botón de correr
        document.getElementById('run-btn')?.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.simulateKeyPress('shift');
        });
    }

    simulateKeyPress(key) {
        // Simular presión y liberación de tecla
        if (this.game && this.game.keys) {
            this.game.keys[key] = true;
            
            setTimeout(() => {
                this.game.keys[key] = false;
            }, 100);
        }
    }

    createScreenEffects() {
        // Estos elementos ya se crean en shaders.js
        // Aquí solo nos aseguramos de que existan
    }

    setupEventListeners() {
        // Eventos de teclado para UI
        document.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case 'h':
                    this.toggleHUD();
                    break;
                case 'm':
                    this.toggleMenu();
                    break;
                case 'escape':
                    this.showPauseMenu();
                    break;
            }
        });
        
        // Eventos táctiles para menú
        if (this.isMobile) {
            document.addEventListener('touchstart', (e) => {
                // Doble toque para menú
                if (e.touches.length === 3) {
                    this.showPauseMenu();
                }
            });
        }
    }

    updateHUD() {
        if (!this.game || !this.game.gameState) return;
        
        const state = this.game.gameState;
        
        // Actualizar fotos
        if (this.elements.photoCount) {
            this.elements.photoCount.textContent = `${state.photosFound}/${state.totalPhotos}`;
        }
        
        // Actualizar batería
        if (this.elements.batteryFill && this.elements.batteryText) {
            const batteryPercent = Math.round(state.flashlightBattery);
            this.elements.batteryFill.style.width = `${batteryPercent}%`;
            this.elements.batteryText.textContent = `${batteryPercent}%`;
            
            // Cambiar color según nivel
            if (batteryPercent > 50) {
                this.elements.batteryFill.style.background = 'linear-gradient(90deg, #00ff00, #ffff00)';
            } else if (batteryPercent > 20) {
                this.elements.batteryFill.style.background = 'linear-gradient(90deg, #ffff00, #ff9900)';
            } else {
                this.elements.batteryFill.style.background = 'linear-gradient(90deg, #ff9900, #ff0000)';
            }
        }
        
        // Actualizar salud
        if (this.elements.healthFill) {
            const healthPercent = Math.round(state.playerHealth);
            this.elements.healthFill.style.width = `${healthPercent}%`;
            
            // Cambiar color según salud
            if (healthPercent > 50) {
                this.elements.healthFill.style.background = 'linear-gradient(90deg, #00ff00, #00aa00)';
            } else if (healthPercent > 20) {
                this.elements.healthFill.style.background = 'linear-gradient(90deg, #ffff00, #ffaa00)';
            } else {
                this.elements.healthFill.style.background = 'linear-gradient(90deg, #ff0000, #aa0000)';
            }
        }
        
        // Actualizar mensaje de monstruo
        if (state.monsterActive) {
            this.updateMonsterWarning(state.monsterDistance);
        }
    }

    showMessage(text, duration = 3000) {
        if (!this.elements.messageBox || !this.elements.messageText) return;
        
        this.elements.messageText.textContent = text;
        this.elements.messageBox.style.display = 'block';
        
        if (duration > 0) {
            setTimeout(() => {
                this.elements.messageBox.style.display = 'none';
            }, duration);
        }
    }

    updateMonsterWarning(distance) {
        let warningText = '';
        
        if (distance < 5) {
            warningText = '¡ESTÁ AQUÍ!';
        } else if (distance < 10) {
            warningText = '¡MUY CERCA!';
        } else if (distance < 15) {
            warningText = 'Está cerca...';
        } else {
            warningText = 'Algo te sigue';
        }
        
        this.showMessage(warningText, 2000);
    }

    toggleHUD() {
        if (this.elements.hud) {
            const isVisible = this.elements.hud.style.display !== 'none';
            this.elements.hud.style.display = isVisible ? 'none' : 'block';
        }
    }

    showPauseMenu() {
        // Crear menú de pausa
        const pauseMenu = document.createElement('div');
        pauseMenu.id = 'pause-menu';
        pauseMenu.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            color: white;
            font-family: 'Courier New', monospace;
        `;
        
        pauseMenu.innerHTML = `
            <h1 style="color: #ff0000; margin-bottom: 30px;">PAUSA</h1>
            <div style="display: flex; flex-direction: column; gap: 15px; align-items: center;">
                <button class="menu-btn" onclick="window.game.resumeGame()">CONTINUAR</button>
                <button class="menu-btn" onclick="window.game.restartGame()">REINICIAR</button>
                <button class="menu-btn" onclick="window.game.toggleMute()">SONIDO: ON/OFF</button>
                <button class="menu-btn" onclick="window.ui.toggleHUD()">MOSTRAR/OCULTAR HUD</button>
                <button class="menu-btn" onclick="window.location.reload()">SALIR</button>
            </div>
            <div style="margin-top: 30px; color: #888; text-align: center;">
                <p>Controles:</p>
                <p>WASD - Movimiento | Mouse - Mirar</p>
                <p>F - Linterna | E - Interactuar</p>
                <p>Shift - Correr | ESC - Menú</p>
            </div>
        `;
        
        document.body.appendChild(pauseMenu);
        
        // Pausar el juego
        if (this.game) {
            this.game.gameState.paused = true;
        }
    }

    showGameOver(reason) {
        // Ocultar HUD
        if (this.elements.hud) {
            this.elements.hud.style.display = 'none';
        }
        
        // Mostrar pantalla de game over
        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen) {
            document.getElementById('game-over-reason').textContent = reason;
            gameOverScreen.style.display = 'flex';
        }
    }

    hideGameOver() {
        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen) {
            gameOverScreen.style.display = 'none';
        }
        
        // Mostrar HUD
        if (this.elements.hud) {
            this.elements.hud.style.display = 'block';
        }
    }

    updateLoadingProgress(progress, text) {
        const loadingBar = document.getElementById('loading-bar');
        const loadingText = document.getElementById('loading-text');
        
        if (loadingBar) {
            loadingBar.style.width = `${progress}%`;
        }
        
        if (loadingText && text) {
            loadingText.textContent = text;
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // Mostrar HUD
        if (this.elements.hud) {
            this.elements.hud.style.display = 'block';
        }
        
        // Mostrar controles móviles si es necesario
        if (this.isMobile && this.elements.mobileControls) {
            this.elements.mobileControls.style.display = 'flex';
        }
    }
}

// Exportar para uso global
window.UIManager = UIManager;