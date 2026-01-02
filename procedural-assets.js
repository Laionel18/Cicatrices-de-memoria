// procedural-assets.js - Generación procedural de assets
class ProceduralAssets {
    constructor(scene) {
        this.scene = scene;
        this.materials = {};
        this.geometries = {};
        
        this.init();
    }

    init() {
        this.createMaterials();
        this.createGeometries();
    }

    createMaterials() {
        // Material de pared
        this.materials.wall = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.9,
            metalness: 0
        });
        
        // Material de piso
        this.materials.floor = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Material de techo
        this.materials.ceiling = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.9
        });
        
        // Material de muebles (madera)
        this.materials.wood = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Material de marco de foto
        this.materials.photoFrame = new THREE.MeshStandardMaterial({
            color: 0x654321,
            roughness: 0.7
        });
    }

    createGeometries() {
        // Geometrías básicas
        this.geometries.box = (width, height, depth) => 
            new THREE.BoxGeometry(width, height, depth);
        
        this.geometries.plane = (width, height) => 
            new THREE.PlaneGeometry(width, height);
        
        this.geometries.sphere = (radius, segments) => 
            new THREE.SphereGeometry(radius, segments, segments);
        
        this.geometries.cylinder = (radius, height) => 
            new THREE.CylinderGeometry(radius, radius, height);
    }

    generateApartment(size = { width: 20, height: 5, depth: 20 }) {
        const apartment = new THREE.Group();
        
        // Piso
        const floor = this.createFloor(size.width, size.depth);
        apartment.add(floor);
        
        // Techo
        const ceiling = this.createCeiling(size.width, size.depth, size.height);
        apartment.add(ceiling);
        
        // Paredes
        const walls = this.createWalls(size.width, size.height, size.depth);
        walls.forEach(wall => apartment.add(wall));
        
        // Muebles
        const furniture = this.generateFurniture();
        furniture.forEach(item => apartment.add(item));
        
        // Puertas y ventanas
        const openings = this.createOpenings(size);
        openings.forEach(opening => apartment.add(opening));
        
        this.scene.add(apartment);
        return apartment;
    }

    createFloor(width, depth) {
        const geometry = this.geometries.plane(width, depth);
        const floor = new THREE.Mesh(geometry, this.materials.floor);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        return floor;
    }

    createCeiling(width, depth, height) {
        const geometry = this.geometries.plane(width, depth);
        const ceiling = new THREE.Mesh(geometry, this.materials.ceiling);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = height;
        ceiling.receiveShadow = true;
        return ceiling;
    }

    createWalls(width, height, depth) {
        const walls = [];
        const thickness = 0.2;
        
        // Pared norte (z negativa)
        const northWall = new THREE.Mesh(
            this.geometries.box(width, height, thickness),
            this.materials.wall
        );
        northWall.position.set(0, height/2, -depth/2 + thickness/2);
        northWall.castShadow = true;
        northWall.receiveShadow = true;
        walls.push(northWall);
        
        // Pared sur (z positiva)
        const southWall = new THREE.Mesh(
            this.geometries.box(width, height, thickness),
            this.materials.wall
        );
        southWall.position.set(0, height/2, depth/2 - thickness/2);
        southWall.castShadow = true;
        southWall.receiveShadow = true;
        walls.push(southWall);
        
        // Pared este (x positiva)
        const eastWall = new THREE.Mesh(
            this.geometries.box(thickness, height, depth - thickness*2),
            this.materials.wall
        );
        eastWall.position.set(width/2 - thickness/2, height/2, 0);
        eastWall.castShadow = true;
        eastWall.receiveShadow = true;
        walls.push(eastWall);
        
        // Pared oeste (x negativa)
        const westWall = new THREE.Mesh(
            this.geometries.box(thickness, height, depth - thickness*2),
            this.materials.wall
        );
        westWall.position.set(-width/2 + thickness/2, height/2, 0);
        westWall.castShadow = true;
        westWall.receiveShadow = true;
        walls.push(westWall);
        
        return walls;
    }

    generateFurniture() {
        const furniture = [];
        const types = [
            { type: 'table', size: [1.5, 0.8, 1.5] },
            { type: 'chair', size: [0.5, 1, 0.5] },
            { type: 'cabinet', size: [1, 2, 0.5] },
            { type: 'bed', size: [2, 0.5, 1.5] }
        ];
        
        const positions = [
            [-6, 0.4, -6],
            [6, 0.4, -6],
            [-6, 0.4, 6],
            [6, 0.4, 6],
            [0, 0.4, -8],
            [0, 0.4, 8],
            [-8, 0.4, 0],
            [8, 0.4, 0]
        ];
        
        positions.forEach((pos, i) => {
            const type = types[i % types.length];
            let mesh;
            
            switch(type.type) {
                case 'table':
                    mesh = this.createTable(...type.size);
                    break;
                case 'chair':
                    mesh = this.createChair(...type.size);
                    break;
                case 'cabinet':
                    mesh = this.createCabinet(...type.size);
                    break;
                case 'bed':
                    mesh = this.createBed(...type.size);
                    break;
            }
            
            if (mesh) {
                mesh.position.set(pos[0], pos[1], pos[2]);
                mesh.rotation.y = Math.random() * Math.PI;
                furniture.push(mesh);
            }
        });
        
        return furniture;
    }

    createTable(width, height, depth) {
        const table = new THREE.Group();
        
        // Tablero
        const top = new THREE.Mesh(
            this.geometries.box(width, 0.1, depth),
            this.materials.wood
        );
        top.position.y = height;
        top.castShadow = true;
        top.receiveShadow = true;
        table.add(top);
        
        // Patas
        const legGeometry = this.geometries.cylinder(0.1, height);
        const positions = [
            [width/2 - 0.2, height/2, depth/2 - 0.2],
            [width/2 - 0.2, height/2, -depth/2 + 0.2],
            [-width/2 + 0.2, height/2, depth/2 - 0.2],
            [-width/2 + 0.2, height/2, -depth/2 + 0.2]
        ];
        
        positions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, this.materials.wood);
            leg.position.set(pos[0], pos[1], pos[2]);
            leg.castShadow = true;
            table.add(leg);
        });
        
        return table;
    }

    createChair(width, height, depth) {
        const chair = new THREE.Group();
        
        // Asiento
        const seat = new THREE.Mesh(
            this.geometries.box(width, 0.1, depth),
            this.materials.wood
        );
        seat.position.y = height * 0.4;
        seat.castShadow = true;
        chair.add(seat);
        
        // Respaldo
        const back = new THREE.Mesh(
            this.geometries.box(width, height * 0.6, 0.1),
            this.materials.wood
        );
        back.position.set(0, height * 0.7, -depth/2 + 0.05);
        back.castShadow = true;
        chair.add(back);
        
        // Patas
        const legGeometry = this.geometries.cylinder(0.08, height * 0.4);
        const positions = [
            [width/2 - 0.15, height * 0.2, depth/2 - 0.15],
            [width/2 - 0.15, height * 0.2, -depth/2 + 0.15],
            [-width/2 + 0.15, height * 0.2, depth/2 - 0.15],
            [-width/2 + 0.15, height * 0.2, -depth/2 + 0.15]
        ];
        
        positions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, this.materials.wood);
            leg.position.set(pos[0], pos[1], pos[2]);
            leg.castShadow = true;
            chair.add(leg);
        });
        
        return chair;
    }

    createCabinet(width, height, depth) {
        const cabinet = new THREE.Mesh(
            this.geometries.box(width, height, depth),
            this.materials.wood
        );
        cabinet.castShadow = true;
        cabinet.receiveShadow = true;
        return cabinet;
    }

    createBed(width, height, depth) {
        const bed = new THREE.Group();
        
        // Colchón
        const mattress = new THREE.Mesh(
            this.geometries.box(width, height * 0.3, depth),
            new THREE.MeshStandardMaterial({ color: 0x996633 })
        );
        mattress.position.y = height * 0.15;
        mattress.castShadow = true;
        bed.add(mattress);
        
        // Cabecera
        const headboard = new THREE.Mesh(
            this.geometries.box(width * 0.8, height * 0.6, 0.1),
            this.materials.wood
        );
        headboard.position.set(0, height * 0.3, -depth/2 + 0.05);
        headboard.castShadow = true;
        bed.add(headboard);
        
        return bed;
    }

    createOpenings(size) {
        const openings = [];
        
        // Puerta
        const door = this.createDoor(1, 2, 0.1);
        door.position.set(0, 1, -size.depth/2 + 0.05);
        openings.push(door);
        
        // Ventanas
        const windowCount = 4;
        for (let i = 0; i < windowCount; i++) {
            const window = this.createWindow(1.5, 1, 0.1);
            
            // Posicionar en diferentes paredes
            switch(i % 4) {
                case 0: // Norte
                    window.position.set(
                        (Math.random() - 0.5) * (size.width - 2),
                        1.5,
                        -size.depth/2 + 0.05
                    );
                    break;
                case 1: // Sur
                    window.position.set(
                        (Math.random() - 0.5) * (size.width - 2),
                        1.5,
                        size.depth/2 - 0.05
                    );
                    window.rotation.y = Math.PI;
                    break;
                case 2: // Este
                    window.position.set(
                        size.width/2 - 0.05,
                        1.5,
                        (Math.random() - 0.5) * (size.depth - 2)
                    );
                    window.rotation.y = Math.PI / 2;
                    break;
                case 3: // Oeste
                    window.position.set(
                        -size.width/2 + 0.05,
                        1.5,
                        (Math.random() - 0.5) * (size.depth - 2)
                    );
                    window.rotation.y = -Math.PI / 2;
                    break;
            }
            
            openings.push(window);
        }
        
        return openings;
    }

    createDoor(width, height, thickness) {
        const door = new THREE.Mesh(
            this.geometries.box(width, height, thickness),
            new THREE.MeshStandardMaterial({ color: 0x8B4513 })
        );
        door.castShadow = true;
        door.receiveShadow = true;
        
        // Añadir perilla
        const knobGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const knobMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const knob = new THREE.Mesh(knobGeometry, knobMaterial);
        knob.position.set(width/2 - 0.1, 0, thickness/2 + 0.02);
        knob.castShadow = true;
        door.add(knob);
        
        return door;
    }

    createWindow(width, height, thickness) {
        const windowFrame = new THREE.Group();
        
        // Marco
        const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const frame = new THREE.Mesh(
            this.geometries.box(width, height, thickness),
            frameMaterial
        );
        frame.castShadow = true;
        windowFrame.add(frame);
        
        // Vidrio
        const glassGeometry = this.geometries.box(width * 0.9, height * 0.9, 0.01);
        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x88ccff,
            transmission: 0.9,
            roughness: 0.1,
            thickness: 0.5,
            transparent: true,
            opacity: 0.3
        });
        const glass = new THREE.Mesh(glassGeometry, glassMaterial);
        glass.position.z = thickness/2 + 0.01;
        windowFrame.add(glass);
        
        return windowFrame;
    }

    createBurntPhoto(id, position) {
        const photoGroup = new THREE.Group();
        
        // Marco
        const frameGeometry = this.geometries.box(0.6, 0.4, 0.05);
        const frame = new THREE.Mesh(frameGeometry, this.materials.photoFrame);
        frame.castShadow = true;
        photoGroup.add(frame);
        
        // Foto
        const photoGeometry = this.geometries.plane(0.5, 0.3);
        const photoMaterial = new THREE.ShaderMaterial(
            ShaderEffects.PhotoShader
        );
        photoMaterial.uniforms.photoId.value = id;
        
        const photo = new THREE.Mesh(photoGeometry, photoMaterial);
        photo.position.z = 0.026;
        photo.rotation.x = -Math.PI / 2;
        frame.add(photo);
        
        // Posicionar
        if (position) {
            photoGroup.position.copy(position);
            photoGroup.rotation.y = Math.random() * Math.PI;
        }
        
        return photoGroup;
    }

    generateLighting() {
        const lights = new THREE.Group();
        
        // Luz ambiental
        const ambientLight = new THREE.AmbientLight(0x222222, 0.3);
        lights.add(ambientLight);
        
        // Luz direccional (luna)
        const directionalLight = new THREE.DirectionalLight(0x445588, 0.2);
        directionalLight.position.set(10, 20, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        lights.add(directionalLight);
        
        // Luces parpadeantes
        const flickeringLights = this.createFlickeringLights();
        flickeringLights.forEach(light => lights.add(light));
        
        this.scene.add(lights);
        return lights;
    }

    createFlickeringLights() {
        const lights = [];
        const positions = [
            [-5, 4, -5],
            [5, 4, -5],
            [-5, 4, 5],
            [5, 4, 5]
        ];
        
        positions.forEach(pos => {
            const light = new THREE.PointLight(0xffaa88, 0.5, 10);
            light.position.set(pos[0], pos[1], pos[2]);
            light.castShadow = true;
            
            // Animación de parpadeo
            const flicker = () => {
                const intensity = 0.3 + Math.random() * 0.4;
                light.intensity = intensity;
                setTimeout(flicker, 100 + Math.random() * 400);
            };
            flicker();
            
            lights.push(light);
            
            // Crear malla para la bombilla
            const bulbGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            const bulbMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xffffaa,
                transparent: true,
                opacity: 0.5
            });
            const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
            bulb.position.copy(light.position);
            lights.push(bulb);
        });
        
        return lights;
    }
}

// Exportar para uso global
window.ProceduralAssets = ProceduralAssets;