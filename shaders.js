// shaders.js - Shaders GLSL para efectos visuales
class ShaderEffects {
    constructor() {
        this.effects = {
            blood: 0,
            distortion: 0,
            static: 0,
            vignette: 0.3,
            chromaticAberration: 0.001,
            filmGrain: 0.02,
            nightVision: 0
        };
        
        this.init();
    }

    init() {
        this.createPostProcessing();
        this.createScreenEffects();
    }

    createPostProcessing() {
        // Este shader se aplicaría como post-processing
        // En Three.js necesitaríamos un efecto de post-procesamiento
        // Por simplicidad, implementaremos efectos CSS
    }

    createScreenEffects() {
        // Crear elementos DOM para efectos de pantalla
        this.createBloodEffect();
        this.createStaticEffect();
        this.createDistortionEffect();
        this.createNightVisionEffect();
    }

    createBloodEffect() {
        const bloodEffect = document.createElement('div');
        bloodEffect.id = 'blood-effect';
        bloodEffect.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at 30% 30%, 
                rgba(255,0,0,0) 0%,
                rgba(255,0,0,0.4) 100%);
            opacity: 0;
            pointer-events: none;
            z-index: 1000;
            transition: opacity 0.3s;
        `;
        document.body.appendChild(bloodEffect);
        
        this.bloodElement = bloodEffect;
    }

    createStaticEffect() {
        const staticEffect = document.createElement('div');
        staticEffect.id = 'static-effect';
        staticEffect.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                repeating-linear-gradient(0deg, 
                    #000 0px, #fff 1px, #000 2px, #fff 3px, #000 4px
                ),
                repeating-linear-gradient(90deg, 
                    #000 0px, #fff 1px, #000 2px, #fff 3px, #000 4px
                );
            opacity: 0;
            pointer-events: none;
            z-index: 1001;
            display: none;
            mix-blend-mode: screen;
        `;
        document.body.appendChild(staticEffect);
        
        this.staticElement = staticEffect;
    }

    createDistortionEffect() {
        const distortionEffect = document.createElement('div');
        distortionEffect.id = 'distortion-effect';
        distortionEffect.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle at 50% 50%, 
                    transparent 30%, 
                    rgba(0,0,0,0.8) 100%
                );
            opacity: 0;
            pointer-events: none;
            z-index: 999;
            backdrop-filter: blur(2px);
            transition: opacity 0.5s;
        `;
        document.body.appendChild(distortionEffect);
        
        this.distortionElement = distortionEffect;
    }

    createNightVisionEffect() {
        const nightVision = document.createElement('div');
        nightVision.id = 'night-vision';
        nightVision.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle at center, 
                    rgba(0,255,0,0.1) 0%, 
                    rgba(0,0,0,0.8) 100%
                );
            pointer-events: none;
            z-index: 998;
            display: none;
            mix-blend-mode: screen;
        `;
        
        // Crear retícula
        const grid = document.createElement('div');
        grid.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: 
                repeating-linear-gradient(0deg, 
                    transparent, 
                    transparent 1px, 
                    rgba(0,255,0,0.1) 2px, 
                    transparent 3px
                ),
                repeating-linear-gradient(90deg, 
                    transparent, 
                    transparent 1px, 
                    rgba(0,255,0,0.1) 2px, 
                    transparent 3px
                );
            opacity: 0.3;
        `;
        nightVision.appendChild(grid);
        
        document.body.appendChild(nightVision);
        this.nightVisionElement = nightVision;
    }

    setEffect(effect, value) {
        this.effects[effect] = Math.max(0, Math.min(1, value));
        this.updateEffects();
    }

    updateEffects() {
        // Efecto de sangre
        if (this.bloodElement) {
            this.bloodElement.style.opacity = this.effects.blood;
        }
        
        // Efecto de distorsión
        if (this.distortionElement) {
            this.distortionElement.style.opacity = this.effects.distortion;
            const blurAmount = 2 + this.effects.distortion * 5;
            this.distortionElement.style.backdropFilter = `blur(${blurAmount}px)`;
        }
        
        // Efecto de estática
        if (this.staticElement) {
            this.staticElement.style.opacity = this.effects.static;
        }
        
        // Visión nocturna
        if (this.nightVisionElement) {
            this.nightVisionElement.style.display = 
                this.effects.nightVision > 0 ? 'block' : 'none';
        }
    }

    triggerBloodEffect(duration = 500) {
        this.setEffect('blood', 0.4);
        
        setTimeout(() => {
            this.setEffect('blood', 0);
        }, duration);
    }

    triggerStaticEffect(duration = 300) {
        if (this.staticElement) {
            this.staticElement.style.display = 'block';
            this.staticElement.style.opacity = '0.7';
            
            setTimeout(() => {
                this.staticElement.style.opacity = '0';
                setTimeout(() => {
                    this.staticElement.style.display = 'none';
                }, 300);
            }, duration);
        }
    }

    setNightVision(active) {
        this.setEffect('nightVision', active ? 1 : 0);
    }

    updateMonsterDistortion(distance) {
        // Distorsión aumenta cuando el monstruo está cerca
        const distortion = Math.max(0, 1 - (distance / 15));
        this.setEffect('distortion', distortion);
        
        // También activar visión nocturna si está muy oscuro
        if (distance < 10 && !this.effects.nightVision) {
            this.setNightVision(true);
        }
    }

    // Shaders GLSL para Three.js
    static get MonsterShader() {
        return {
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
            `
        };
    }

    static get PhotoShader() {
        return {
            uniforms: {
                time: { value: 0 },
                burnAmount: { value: 0.7 },
                photoId: { value: 0 }
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
        };
    }
}

// Exportar para uso global
window.ShaderEffects = ShaderEffects;