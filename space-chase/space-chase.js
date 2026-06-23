import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'https://esm.sh/gsap@3.14.2';

document.addEventListener('DOMContentLoaded', function() {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Set black background
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#spaceship-canvas'),
        antialias: true,
        alpha: true
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // Add OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    
    // Configure controls
    controls.enableDamping = true; // Add smooth damping effect
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 4; // Minimum zoom distance
    controls.maxDistance = 15; // Maximum zoom distance
    controls.enableZoom = true; // Enable zooming
    controls.enablePan = true; // Enable panning
    controls.enableRotate = true; // Enable rotation
    controls.rotateSpeed = 0.5; // Adjust rotation speed
    controls.zoomSpeed = 1.0; // Adjust zoom speed
    controls.panSpeed = 1.0; // Adjust pan speed

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Main directional light (sun-like)
    const mainLight = new THREE.DirectionalLight(0xffffff, 3);
    mainLight.position.set(5, 10, 5); // Increased y-position from 5 to 10 for higher angle
    scene.add(mainLight);

    // Secondary directional light (fill light)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    // Accent light (rim lighting)
    const accentLight = new THREE.DirectionalLight(0xffffff, 0.6);
    accentLight.position.set(0, -5, 0);
    scene.add(accentLight);

    // Create and load environment map for reflections BEFORE loading the model
    const cubeTextureLoader = new THREE.CubeTextureLoader();
    const envMap = cubeTextureLoader.load([
        '/space-chase/textures/cube/SwedishRoyalCastle/px.jpg',
        '/space-chase/textures/cube/SwedishRoyalCastle/nx.jpg',
        '/space-chase/textures/cube/SwedishRoyalCastle/py.jpg',
        '/space-chase/textures/cube/SwedishRoyalCastle/ny.jpg',
        '/space-chase/textures/cube/SwedishRoyalCastle/pz.jpg',
        '/space-chase/textures/cube/SwedishRoyalCastle/nz.jpg'
    ]);
    envMap.colorSpace = THREE.SRGBColorSpace;
    scene.environment = envMap;

    // Create audio element for laser sound
    
    const laserSound = new Audio(`${window.location.origin}/space-chase/audio/laser.mp4`);
    laserSound.volume = 0.5; // Set volume to 50%

    // Create audio element for TIE fighter laser sound
    const tieLaserSound = new Audio(`${window.location.origin}/space-chase/audio/evil-laser.mp3`);
    tieLaserSound.volume = 0.21; // Reduced from 0.3 to 0.21 (30% lower)

    // Create audio element for ambient space sound
    const ambientSound = new Audio(`${window.location.origin}/space-chase/audio/ambient.mp3`);
    ambientSound.volume = 0.3; // Set volume to 30%
    ambientSound.loop = true; // Enable looping
    let isAmbientSoundPlaying = false;
    let isSoundEnabled = false; // Start with sound disabled

    // Create toggle button for sound effects
    const soundToggleButton = document.createElement('button');
    soundToggleButton.style.position = 'fixed';
    soundToggleButton.style.top = '20px';
    soundToggleButton.style.right = '20px';
    soundToggleButton.style.padding = '10px 20px';
    soundToggleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    soundToggleButton.style.color = '#00ffff';
    soundToggleButton.style.border = '1px solid #00ffff';
    soundToggleButton.style.borderRadius = '5px';
    soundToggleButton.style.cursor = 'pointer';
    soundToggleButton.style.fontFamily = 'Arial, sans-serif';
    soundToggleButton.style.zIndex = '1000';
    soundToggleButton.innerHTML = '🔇 Sound Off'; // Start with muted icon
    document.body.appendChild(soundToggleButton);

    // Add click event listener for sound toggle
    soundToggleButton.addEventListener('click', () => {
        isSoundEnabled = !isSoundEnabled;
        
        if (isSoundEnabled) {
            // Start playing ambient sound
            ambientSound.play().catch(error => {
                console.log('Error playing ambient sound:', error);
            });
            isAmbientSoundPlaying = true;
            soundToggleButton.innerHTML = '🔊 Sound On';
        } else {
            // Pause ambient sound
            ambientSound.pause();
            isAmbientSoundPlaying = false;
            soundToggleButton.innerHTML = '🔇 Sound Off';
        }
    });

    // Function to play sound with global sound state check
    function playSound(sound) {
        if (isSoundEnabled) {
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.log('Error playing sound:', error);
            });
        }
    }

    // Create starfield
    const starCount = 1000; // Number of stars
    const starGroup = new THREE.Group();
    scene.add(starGroup);
    const starVelocities = new Float32Array(starCount); // Store velocities for each star
    let starSpeedMultiplier = 1.0; // Track overall star speed

    // Create star geometry and material
    const starGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const starMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8
    });

    // Initialize stars with random positions and velocities
    for (let i = 0; i < starCount; i++) {
        const star = new THREE.Mesh(starGeometry, starMaterial);
        
        // Random position in a sphere
        const radius = Math.random() * 100 + 50; // Between 50 and 150 units from center
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 2;
        
        star.position.x = radius * Math.sin(phi) * Math.cos(theta);
        star.position.y = radius * Math.sin(phi) * Math.sin(theta);
        star.position.z = radius * Math.cos(phi);
        
        // Random velocity (speed) for each star - start faster
        starVelocities[i] = Math.random() * 4 + 2; // Between 2 and 6 units per frame (doubled from 1-3)
        
        starGroup.add(star);
    }

    // Create flame particle system
    const flameParticleCount = 1000;
    const flameGeometry = new THREE.BufferGeometry();
    const flamePositions = new Float32Array(flameParticleCount * 3);
    const flameVelocities = new Float32Array(flameParticleCount);
    const flameColors = new Float32Array(flameParticleCount * 3);
    const flameSizes = new Float32Array(flameParticleCount);

    // Create flame material
    const flameTexture = new THREE.TextureLoader().load('/space-chase/textures/sprites/disc.png');
    const flameMaterial = new THREE.PointsMaterial({
        size: 0.1,
        map: flameTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexColors: true
    });

    // Initialize flame particles
    for (let i = 0; i < flameParticleCount; i++) {
        const i3 = i * 3;
        
        // Random position at the back of the ship
        flamePositions[i3] = (Math.random() - 0.5) * 0.45;     // x (50% wider spread)
        flamePositions[i3 + 1] = (Math.random() - 0.5) * 0.225; // y (50% taller)
        flamePositions[i3 + 2] = -1.0;                        // z (20% closer)
        
        // Random velocity
        flameVelocities[i] = Math.random() * 0.1 + 0.05;
        
        // Random color (orange to yellow gradient)
        const color = new THREE.Color();
        color.setHSL(0.1 + Math.random() * 0.1, 1, 0.5 + Math.random() * 0.5);
        flameColors[i3] = color.r;
        flameColors[i3 + 1] = color.g;
        flameColors[i3 + 2] = color.b;
        
        // Random size
        flameSizes[i] = Math.random() * 0.1 + 0.05;
    }

    flameGeometry.setAttribute('position', new THREE.BufferAttribute(flamePositions, 3));
    flameGeometry.setAttribute('color', new THREE.BufferAttribute(flameColors, 3));
    flameGeometry.setAttribute('size', new THREE.BufferAttribute(flameSizes, 1));

    const flameParticles = new THREE.Points(flameGeometry, flameMaterial);
    scene.add(flameParticles);

    // Create a group to hold both the ship and flames
    const shipAndFlamesGroup = new THREE.Group();
    scene.add(shipAndFlamesGroup);

    // Create a separate group for the TIE fighter
    const tieFighterGroup = new THREE.Group();
    scene.add(tieFighterGroup);

    // Create a separate group for the second TIE fighter
    const tieFighter2Group = new THREE.Group();
    scene.add(tieFighter2Group);

    // Create a separate group for tilt controls
    const tiltWrapper = new THREE.Group();
    shipAndFlamesGroup.add(tiltWrapper);

    // Create a new wrapper for floating animation
    const floatingWrapper = new THREE.Group();
    tiltWrapper.add(floatingWrapper);

    // Create groups to hold the lasers and their trails
    const leftLaserGroup = new THREE.Group();
    const rightLaserGroup = new THREE.Group();
    floatingWrapper.add(leftLaserGroup);
    floatingWrapper.add(rightLaserGroup);

    // Create laser beams for main ship
    const laserGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 32);
    const laserMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    
    const leftLaserBeam = new THREE.Mesh(laserGeometry, laserMaterial);
    const rightLaserBeam = new THREE.Mesh(laserGeometry, laserMaterial.clone());
    leftLaserBeam.visible = false;
    rightLaserBeam.visible = false;
    leftLaserGroup.add(leftLaserBeam);
    rightLaserGroup.add(rightLaserBeam);

    // Create laser trail particles for both lasers
    const trailParticleCount = 50;
    const leftTrailGeometry = new THREE.BufferGeometry();
    const rightTrailGeometry = new THREE.BufferGeometry();
    const leftTrailPositions = new Float32Array(trailParticleCount * 3);
    const rightTrailPositions = new Float32Array(trailParticleCount * 3);
    const trailColors = new Float32Array(trailParticleCount * 3);
    const trailSizes = new Float32Array(trailParticleCount);

    const trailTexture = new THREE.TextureLoader().load('/space-chase/textures/sprites/disc.png');
    const trailMaterial = new THREE.PointsMaterial({
        size: 0.1,
        map: trailTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexColors: true
    });

    // Initialize trail particles for both lasers
    for (let i = 0; i < trailParticleCount; i++) {
        const i3 = i * 3;
        leftTrailPositions[i3] = 0;
        leftTrailPositions[i3 + 1] = 0;
        leftTrailPositions[i3 + 2] = 0;
        
        rightTrailPositions[i3] = 0;
        rightTrailPositions[i3 + 1] = 0;
        rightTrailPositions[i3 + 2] = 0;
        
        // Color from cyan to transparent
        const color = new THREE.Color(0x00ffff);
        color.multiplyScalar(1 - (i / trailParticleCount));
        trailColors[i3] = color.r;
        trailColors[i3 + 1] = color.g;
        trailColors[i3 + 2] = color.b;
        
        trailSizes[i] = 0.1 * (1 - (i / trailParticleCount));
    }

    leftTrailGeometry.setAttribute('position', new THREE.BufferAttribute(leftTrailPositions, 3));
    leftTrailGeometry.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
    leftTrailGeometry.setAttribute('size', new THREE.BufferAttribute(trailSizes, 1));

    rightTrailGeometry.setAttribute('position', new THREE.BufferAttribute(rightTrailPositions, 3));
    rightTrailGeometry.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
    rightTrailGeometry.setAttribute('size', new THREE.BufferAttribute(trailSizes, 1));

    const leftLaserTrail = new THREE.Points(leftTrailGeometry, trailMaterial);
    const rightLaserTrail = new THREE.Points(rightTrailGeometry, trailMaterial);
    leftLaserTrail.visible = false;
    rightLaserTrail.visible = false;
    leftLaserGroup.add(leftLaserTrail);
    rightLaserGroup.add(rightLaserTrail);

    // Position the laser groups at the front of the ship
    leftLaserGroup.position.z = 1.5;
    leftLaserGroup.position.y = -0.5;
    leftLaserGroup.position.x = -0.2;
    leftLaserBeam.rotation.x = Math.PI / 2;

    rightLaserGroup.position.z = 1.5;
    rightLaserGroup.position.y = -0.5;
    rightLaserGroup.position.x = 0.2;
    rightLaserBeam.rotation.x = Math.PI / 2;

    // Position the flame particles at the back of the ship
    flameParticles.position.z = -2.0; // Move 20% closer
    flameParticles.position.y = -0.5; // Keep the same height

    // Create TIE fighter laser group
    const tieLaserGroup = new THREE.Group();

    // Create TIE fighter laser beam
    const tieLaserGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 32);
    const tieLaserMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    
    const tieLaserBeam = new THREE.Mesh(tieLaserGeometry, tieLaserMaterial);
    tieLaserBeam.visible = false;
    tieLaserGroup.add(tieLaserBeam);

    // Create TIE fighter laser trail
    const tieTrailParticleCount = 50;
    const tieTrailGeometry = new THREE.BufferGeometry();
    const tieTrailPositions = new Float32Array(tieTrailParticleCount * 3);
    const tieTrailColors = new Float32Array(tieTrailParticleCount * 3);
    const tieTrailSizes = new Float32Array(tieTrailParticleCount);

    // Create trail material for TIE fighter laser
    const tieTrailTexture = new THREE.TextureLoader().load('/space-chase/textures/sprites/disc.png');
    const tieTrailMaterial = new THREE.PointsMaterial({
        size: 0.1,
        map: tieTrailTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexColors: true
    });

    // Initialize TIE fighter trail particles
    for (let i = 0; i < tieTrailParticleCount; i++) {
        const i3 = i * 3;
        tieTrailPositions[i3] = 0;
        tieTrailPositions[i3 + 1] = 0;
        tieTrailPositions[i3 + 2] = 0;
        
        // Color from red to transparent
        const color = new THREE.Color(0xff0000);
        color.multiplyScalar(1 - (i / tieTrailParticleCount));
        tieTrailColors[i3] = color.r;
        tieTrailColors[i3 + 1] = color.g;
        tieTrailColors[i3 + 2] = color.b;
        
        tieTrailSizes[i] = 0.1 * (1 - (i / tieTrailParticleCount));
    }

    tieTrailGeometry.setAttribute('position', new THREE.BufferAttribute(tieTrailPositions, 3));
    tieTrailGeometry.setAttribute('color', new THREE.BufferAttribute(tieTrailColors, 3));
    tieTrailGeometry.setAttribute('size', new THREE.BufferAttribute(tieTrailSizes, 1));

    const tieLaserTrail = new THREE.Points(tieTrailGeometry, tieTrailMaterial);
    tieLaserTrail.visible = false;
    tieLaserGroup.add(tieLaserTrail);

    // TIE fighter variables
    let isTieLaserActive = false;
    let tieLaserProgress = 0;
    let lastTieLaserTime = 0;
    let tieLaserTween = null;
    let tieFighter;
    let tieFighterModel;
    let tieFighterAnimation = null;

    // Second TIE fighter variables
    let isTie2LaserActive = false;
    let tie2LaserProgress = 0;
    let lastTie2LaserTime = 0;
    let tie2LaserTween = null;
    let tieFighter2;
    let tieFighter2Model;
    let tieFighter2Animation = null;
    let tie2LaserBeam;
    let tie2LaserGroup;
    let tie2LaserTrail;
    let tie2TrailGeometry;
    let tie2TrailPositions;
    let tie2TrailParticleCount = 50;

    // Load the TIE fighter model
    const tieLoader = new GLTFLoader();
    const tieModelPath = `${window.location.origin}/space-chase/models/tiefighter.glb`;
    
    // Load first TIE fighter
    tieLoader.load(
        tieModelPath,
        function (gltf) {
            console.log('TIE fighter model loaded successfully');
            tieFighter = gltf.scene;
            
            // Calculate the bounding box and center
            const tieBox = new THREE.Box3().setFromObject(tieFighter);
            const tieCenter = tieBox.getCenter(new THREE.Vector3());
            
            // Create a group to hold the TIE fighter
            tieFighterModel = new THREE.Group();
            
            // Move the TIE fighter to be centered at the origin
            tieFighter.position.sub(tieCenter);
            
            // Add the TIE fighter to the group
            tieFighterModel.add(tieFighter);
            
            // Scale the TIE fighter model
            tieFighter.scale.set(0.3, 0.3, 0.3);

            tieFighter.traverse((child) => {
                if (child.isMesh && child.material) {
                    const oldMat = child.material;
                    const newMat = new THREE.MeshStandardMaterial({
                        color: oldMat.color,
                        map: oldMat.map,
                        metalness: oldMat.metalness,
                        roughness: oldMat.roughness,
                        metalnessMap: oldMat.metalnessMap,
                        roughnessMap: oldMat.roughnessMap,
                        normalMap: oldMat.normalMap,
                        aoMap: oldMat.aoMap,
                        emissiveMap: oldMat.emissiveMap,
                        envMap: envMap,
                        envMapIntensity: 1.5,
                        side: oldMat.side
                    });
                    child.material = newMat;
                }
            });

            // Position the TIE fighter behind the main ship
            tieFighterModel.position.z = -20;
            tieFighterModel.position.y = 2;
            tieFighterModel.position.x = 3;

            // Set initial rotation to face the main ship
            tieFighterModel.rotation.y = 0;
            tieFighterModel.rotation.x = 0.1;

            // Add the TIE fighter model to the TIE fighter group
            tieFighterGroup.add(tieFighterModel);

            // Add the laser group to the TIE fighter model
            tieFighter.add(tieLaserGroup);

            // Position the TIE fighter's laser at the center of the model
            tieLaserGroup.position.set(0, 0, 1.5);
            tieLaserBeam.rotation.x = Math.PI / 2;

            // Start the TIE fighter's random firing pattern
            startTieFighterFiring();
            
            // Start the TIE fighter's floating animation
            startTieFighterAnimation();
        },
        function (xhr) {
            console.log('TIE fighter loading progress:', (xhr.loaded / xhr.total * 100) + '%');
        },
        function (error) {
            console.error('Error loading TIE fighter model:', error);
        }
    );

    // Load second TIE fighter
    tieLoader.load(
        tieModelPath,
        function (gltf) {
            console.log('Second TIE fighter model loaded successfully');
            tieFighter2 = gltf.scene;
            
            // Calculate the bounding box and center
            const tie2Box = new THREE.Box3().setFromObject(tieFighter2);
            const tie2Center = tie2Box.getCenter(new THREE.Vector3());
            
            // Create a group to hold the second TIE fighter
            tieFighter2Model = new THREE.Group();
            
            // Move the TIE fighter to be centered at the origin
            tieFighter2.position.sub(tie2Center);
            
            // Add the TIE fighter to the group
            tieFighter2Model.add(tieFighter2);
            
            // Scale the TIE fighter model
            tieFighter2.scale.set(0.3, 0.3, 0.3);

            tieFighter2.traverse((child) => {
                if (child.isMesh && child.material) {
                    const oldMat = child.material;
                    const newMat = new THREE.MeshStandardMaterial({
                        color: oldMat.color,
                        map: oldMat.map,
                        metalness: oldMat.metalness,
                        roughness: oldMat.roughness,
                        metalnessMap: oldMat.metalnessMap,
                        roughnessMap: oldMat.roughnessMap,
                        normalMap: oldMat.normalMap,
                        aoMap: oldMat.aoMap,
                        emissiveMap: oldMat.emissiveMap,
                        envMap: envMap,
                        envMapIntensity: 1.5,
                        side: oldMat.side
                    });
                    child.material = newMat;
                }
            });

            // Position the second TIE fighter in a different position
            tieFighter2Model.position.z = -15;
            tieFighter2Model.position.y = 4;
            tieFighter2Model.position.x = -4;

            // Set initial rotation to face the main ship
            tieFighter2Model.rotation.y = 0;
            tieFighter2Model.rotation.x = 0.1;

            // Add the TIE fighter model to the second TIE fighter group
            tieFighter2Group.add(tieFighter2Model);

            // Create and add laser group for second TIE fighter
            tie2LaserGroup = new THREE.Group();
            tieFighter2.add(tie2LaserGroup);

            // Create TIE fighter 2 laser beam
            const tie2LaserGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 32);
            const tie2LaserMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            
            tie2LaserBeam = new THREE.Mesh(tie2LaserGeometry, tie2LaserMaterial);
            tie2LaserBeam.visible = false;
            tie2LaserGroup.add(tie2LaserBeam);

            // Create TIE fighter 2 laser trail
            tie2TrailGeometry = new THREE.BufferGeometry();
            tie2TrailPositions = new Float32Array(tie2TrailParticleCount * 3);
            const tie2TrailColors = new Float32Array(tie2TrailParticleCount * 3);
            const tie2TrailSizes = new Float32Array(tie2TrailParticleCount);

            // Initialize TIE fighter 2 trail particles
            for (let i = 0; i < tie2TrailParticleCount; i++) {
                const i3 = i * 3;
                tie2TrailPositions[i3] = 0;
                tie2TrailPositions[i3 + 1] = 0;
                tie2TrailPositions[i3 + 2] = 0;
                
                const color = new THREE.Color(0xff0000);
                color.multiplyScalar(1 - (i / tie2TrailParticleCount));
                tie2TrailColors[i3] = color.r;
                tie2TrailColors[i3 + 1] = color.g;
                tie2TrailColors[i3 + 2] = color.b;
                
                tie2TrailSizes[i] = 0.1 * (1 - (i / tie2TrailParticleCount));
            }

            tie2TrailGeometry.setAttribute('position', new THREE.BufferAttribute(tie2TrailPositions, 3));
            tie2TrailGeometry.setAttribute('color', new THREE.BufferAttribute(tie2TrailColors, 3));
            tie2TrailGeometry.setAttribute('size', new THREE.BufferAttribute(tie2TrailSizes, 1));

            tie2LaserTrail = new THREE.Points(tie2TrailGeometry, tieTrailMaterial);
            tie2LaserTrail.visible = false;
            tie2LaserGroup.add(tie2LaserTrail);

            // Position the TIE fighter 2's laser at the center of the model
            tie2LaserGroup.position.set(0, 0, 1.5);
            tie2LaserBeam.rotation.x = Math.PI / 2;

            // Start the second TIE fighter's random firing pattern
            startTieFighter2Firing();
            
            // Start the second TIE fighter's floating animation
            startTieFighter2Animation();
        },
        function (xhr) {
            console.log('Second TIE fighter loading progress:', (xhr.loaded / xhr.total * 100) + '%');
        },
        function (error) {
            console.error('Error loading second TIE fighter model:', error);
        }
    );

    // Function to handle TIE fighter laser firing
    function fireTieLaser() {
        if (!isTieLaserActive) {
            isTieLaserActive = true;
            tieLaserProgress = 0;
            lastTieLaserTime = Date.now();
            
            // Play TIE fighter laser sound with sound state check
            playSound(tieLaserSound);
            
            // Reset laser and trail
            tieLaserBeam.visible = true;
            tieLaserBeam.scale.y = 0.1;
            tieLaserBeam.material.opacity = 0.8;
            tieLaserGroup.position.z = 1.5;
            
            tieLaserTrail.visible = true;
            for (let i = 0; i < tieTrailParticleCount; i++) {
                const i3 = i * 3;
                tieTrailPositions[i3] = 0;
                tieTrailPositions[i3 + 1] = 0;
                tieTrailPositions[i3 + 2] = 0;
            }
            tieTrailGeometry.attributes.position.needsUpdate = true;

            // Add random offset to laser direction with closer targeting
            const randomX = (Math.random() - 0.5) * 0.8;
            const randomY = (Math.random() - 0.5) * 0.4;
            const targetZ = 100 + (Math.random() - 0.5) * 20;

            // Create laser firing animation
            if (tieLaserTween) tieLaserTween.kill();
            tieLaserTween = gsap.timeline()
                .to(tieLaserBeam.scale, {
                    y: 1,
                    duration: 0.1,
                    ease: "power2.out"
                })
                .to(tieLaserGroup.position, {
                    x: randomX,
                    y: randomY,
                    z: targetZ,
                    duration: 1.2,
                    ease: "power1.in",
                    onUpdate: () => {
                        // Update trail particles
                        for (let i = 0; i < tieTrailParticleCount; i++) {
                            const i3 = i * 3;
                            const progress = i / tieTrailParticleCount;
                            tieTrailPositions[i3] = tieLaserGroup.position.x * (1 - progress);
                            tieTrailPositions[i3 + 1] = tieLaserGroup.position.y * (1 - progress);
                            tieTrailPositions[i3 + 2] = tieLaserGroup.position.z * (1 - progress);
                        }
                        tieTrailGeometry.attributes.position.needsUpdate = true;
                    }
                })
                .to(tieLaserBeam.material, {
                    opacity: 0,
                    duration: 0.1,
                    onComplete: () => {
                        isTieLaserActive = false;
                        tieLaserBeam.visible = false;
                        tieLaserTrail.visible = false;
                        tieLaserGroup.position.set(0, 0, 1.5);
                        tieLaserBeam.material.opacity = 0.8;
                    }
                });
        }
    }

    // Function to start random TIE fighter firing pattern
    function startTieFighterFiring() {
        function scheduleNextShot() {
            const delay = Math.random() * 1000 + 500; // Random delay between 0.5-1.5 seconds
            setTimeout(() => {
                fireTieLaser();
                scheduleNextShot();
            }, delay);
        }
        scheduleNextShot();
    }

    // Function to create smooth floating animation for TIE fighter
    function startTieFighterAnimation() {
        // Create a timeline for continuous floating motion
        tieFighterAnimation = gsap.timeline({
            repeat: -1, // Infinite repeat
            yoyo: true  // Reverse the animation
        });

        // Add multiple tweens for organic movement
        tieFighterAnimation
            // Vertical movement (up and down) with pitch
            .to(tieFighterModel.position, {
                y: 4, // Move up
                duration: 4, // Reduced from 8 to 4 seconds
                ease: "sine.inOut"
            })
            .to(tieFighterModel.rotation, {
                x: 0.2, // Slight nose up as it climbs
                duration: 4, // Reduced from 8 to 4 seconds
                ease: "sine.inOut"
            }, "<")
            // Horizontal movement (port to starboard) with banking
            .to(tieFighterModel.position, {
                x: -3, // Move to port side
                duration: 5, // Reduced from 10 to 5 seconds
                ease: "sine.inOut"
            }, "<")
            // Rotation for scanning effect (maintains general direction towards ship)
            .to(tieFighterModel.rotation, {
                y: 0.2, // Keep facing forward with slight variation
                duration: 4, // Reduced from 8 to 4 seconds
                ease: "sine.inOut"
            }, "<")
            // Banking (roll) as it moves
            .to(tieFighterModel.rotation, {
                z: 0.3, // Bank right as it moves left
                duration: 5, // Reduced from 10 to 5 seconds
                ease: "sine.inOut"
            }, "<")
            // Move down and to starboard with pitch
            .to(tieFighterModel.position, {
                y: 0, // Move down
                x: 3, // Move to starboard
                duration: 5, // Reduced from 10 to 5 seconds
                ease: "sine.inOut"
            })
            .to(tieFighterModel.rotation, {
                x: -0.1, // Slight nose down as it descends
                duration: 5, // Reduced from 10 to 5 seconds
                ease: "sine.inOut"
            }, "<")
            // Bank left as it moves right
            .to(tieFighterModel.rotation, {
                z: -0.3,
                duration: 5, // Reduced from 10 to 5 seconds
                ease: "sine.inOut"
            }, "<")
            // Return to original position and rotation
            .to(tieFighterModel.position, {
                y: 2,
                x: 3,
                duration: 4, // Reduced from 8 to 4 seconds
                ease: "sine.inOut"
            })
            .to(tieFighterModel.rotation, {
                x: 0.1, // Return to slight upward tilt
                y: 0, // Return to facing forward
                z: 0,
                duration: 4, // Reduced from 8 to 4 seconds
                ease: "sine.inOut"
            }, "<");
    }

    // Function to handle second TIE fighter laser firing
    function fireTie2Laser() {
        if (!isTie2LaserActive) {
            isTie2LaserActive = true;
            tie2LaserProgress = 0;
            lastTie2LaserTime = Date.now();
            
            // Play TIE fighter laser sound with sound state check
            playSound(tieLaserSound);
            
            // Reset laser and trail
            tie2LaserBeam.visible = true;
            tie2LaserBeam.scale.y = 0.1;
            tie2LaserBeam.material.opacity = 0.8;
            tie2LaserGroup.position.z = 1.5;
            
            tie2LaserTrail.visible = true;
            for (let i = 0; i < tie2TrailParticleCount; i++) {
                const i3 = i * 3;
                tie2TrailPositions[i3] = 0;
                tie2TrailPositions[i3 + 1] = 0;
                tie2TrailPositions[i3 + 2] = 0;
            }
            tie2TrailGeometry.attributes.position.needsUpdate = true;

            // Add random offset to laser direction with closer targeting
            const randomX = (Math.random() - 0.5) * 0.8;
            const randomY = (Math.random() - 0.5) * 0.4;
            const targetZ = 100 + (Math.random() - 0.5) * 20;

            // Create laser firing animation
            if (tie2LaserTween) tie2LaserTween.kill();
            tie2LaserTween = gsap.timeline()
                .to(tie2LaserBeam.scale, {
                    y: 1,
                    duration: 0.1,
                    ease: "power2.out"
                })
                .to(tie2LaserGroup.position, {
                    x: randomX,
                    y: randomY,
                    z: targetZ,
                    duration: 1.2,
                    ease: "power1.in",
                    onUpdate: () => {
                        // Update trail particles
                        for (let i = 0; i < tie2TrailParticleCount; i++) {
                            const i3 = i * 3;
                            const progress = i / tie2TrailParticleCount;
                            tie2TrailPositions[i3] = tie2LaserGroup.position.x * (1 - progress);
                            tie2TrailPositions[i3 + 1] = tie2LaserGroup.position.y * (1 - progress);
                            tie2TrailPositions[i3 + 2] = tie2LaserGroup.position.z * (1 - progress);
                        }
                        tie2TrailGeometry.attributes.position.needsUpdate = true;
                    }
                })
                .to(tie2LaserBeam.material, {
                    opacity: 0,
                    duration: 0.1,
                    onComplete: () => {
                        isTie2LaserActive = false;
                        tie2LaserBeam.visible = false;
                        tie2LaserTrail.visible = false;
                        tie2LaserGroup.position.set(0, 0, 1.5);
                        tie2LaserBeam.material.opacity = 0.8;
                    }
                });
        }
    }

    // Function to start random second TIE fighter firing pattern
    function startTieFighter2Firing() {
        function scheduleNextShot() {
            const delay = Math.random() * 1000 + 500; // Random delay between 0.5-1.5 seconds
            setTimeout(() => {
                fireTie2Laser();
                scheduleNextShot();
            }, delay);
        }
        scheduleNextShot();
    }

    // Function to create smooth floating animation for second TIE fighter
    function startTieFighter2Animation() {
        // Create a timeline for continuous floating motion
        tieFighter2Animation = gsap.timeline({
            repeat: -1,
            yoyo: true
        });

        // Add multiple tweens for organic movement
        tieFighter2Animation
            // Vertical movement (up and down) with pitch
            .to(tieFighter2Model.position, {
                y: 6, // Move up higher than first TIE fighter
                duration: 3, // Faster than first TIE fighter
                ease: "sine.inOut"
            })
            .to(tieFighter2Model.rotation, {
                x: 0.2,
                duration: 3,
                ease: "sine.inOut"
            }, "<")
            // Horizontal movement (port to starboard) with banking
            .to(tieFighter2Model.position, {
                x: 2, // Reduced from 4 to 2 for tighter movement
                duration: 4,
                ease: "sine.inOut"
            }, "<")
            // Rotation for scanning effect
            .to(tieFighter2Model.rotation, {
                y: -0.2, // Opposite direction from first TIE fighter
                duration: 3,
                ease: "sine.inOut"
            }, "<")
            // Banking (roll) as it moves
            .to(tieFighter2Model.rotation, {
                z: -0.3,
                duration: 4,
                ease: "sine.inOut"
            }, "<")
            // Move down and to port with pitch
            .to(tieFighter2Model.position, {
                y: 2,
                x: -2, // Reduced from -4 to -2 for tighter movement
                duration: 4,
                ease: "sine.inOut"
            })
            .to(tieFighter2Model.rotation, {
                x: -0.1,
                duration: 4,
                ease: "sine.inOut"
            }, "<")
            // Bank right as it moves left
            .to(tieFighter2Model.rotation, {
                z: 0.3,
                duration: 4,
                ease: "sine.inOut"
            }, "<")
            // Return to original position and rotation
            .to(tieFighter2Model.position, {
                y: 4,
                x: -4,
                duration: 3,
                ease: "sine.inOut"
            })
            .to(tieFighter2Model.rotation, {
                x: 0.1,
                y: 0,
                z: 0,
                duration: 3,
                ease: "sine.inOut"
            }, "<");
    }

    // Load the spaceship model
    const loader = new GLTFLoader();
    let spaceship;
    let spaceshipGroup;
    let rollAngle = 0; // Track the current roll angle
    const rollSpeed = 0.01; // Speed of the roll
    const rollAmount = 0.05; // Maximum roll amount in radians

    // Laser animation variables
    let isLaserActive = false;
    let laserProgress = 0;
    const laserSpeed = 0.1;
    const laserDuration = 0.5; // Duration of laser beam in seconds
    let lastLaserTime = 0;
    let laserTween = null;

    // Get the theme URL from WordPress with the correct path including /sandbox/
    const modelPath = `${window.location.origin}/space-chase/models/spaceship.glb`;
    
    console.log('Attempting to load model from:', modelPath);
    
    loader.load(
        modelPath,
        function (gltf) {
            console.log('Model loaded successfully');
            spaceship = gltf.scene;
            
            // Calculate the bounding box and center
            const box = new THREE.Box3().setFromObject(spaceship);
            const center = box.getCenter(new THREE.Vector3());
            
            // Create a group to hold the spaceship
            spaceshipGroup = new THREE.Group();
            
            // Move the spaceship to be centered at the origin
            spaceship.position.sub(center);
            
            // Add the spaceship to the group
            spaceshipGroup.add(spaceship);
            
            // Scale the model if needed
            spaceship.scale.set(0.5, 0.5, 0.5);

            // Create ghost copies for motion blur effect
            const ghostCount = 5; // Number of ghost copies
            const ghostCopies = [];
            const ghostMaterials = [];

            for (let i = 0; i < ghostCount; i++) {
                // Clone the ship
                const ghostShip = spaceship.clone();
                
                // Create transparent material for the ghost
                const ghostMaterial = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.1 * (1 - (i / ghostCount)), // Decreasing opacity for each ghost
                    metalness: 0.5,
                    roughness: 0.5,
                    envMap: envMap
                });
                
                // Apply the transparent material to all meshes in the ghost
                ghostShip.traverse((child) => {
                    if (child.isMesh) {
                        child.material = ghostMaterial;
                    }
                });
                
                ghostCopies.push(ghostShip);
                ghostMaterials.push(ghostMaterial);
                
                // Add ghost to the group
                spaceshipGroup.add(ghostShip);
            }

            // Add both the ship group and flames to the floating wrapper
            floatingWrapper.add(spaceshipGroup);
            floatingWrapper.add(flameParticles);

            // Set initial camera position based on model size
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            
            // Create the cinematic animation sequence
            const timeline = gsap.timeline({
                onComplete: () => {
                    // Enable controls after animation completes
                    controls.enabled = true;
                    
                    // Fade out ghost copies
                    ghostMaterials.forEach(material => {
                        gsap.to(material, {
                            opacity: 0,
                            duration: 1,
                            onComplete: () => {
                                material.dispose();
                            }
                        });
                    });
                }
            });

            // Disable controls during animation
            controls.enabled = false;

            // Enable keyboard controls immediately
            enableKeyboardControls();
            enableMobileControls();

            // Keyboard controls for ship tilting and laser
            function enableKeyboardControls() {
                const maxTilt = 1.2; // Increased to about 57 degrees (1 radian)
                let currentTilt = 0;
                let targetTilt = 0;
                let isTilting = false;
                let tiltSpeed = 0.05; // Increased initial speed for faster response
                let tiltAcceleration = 0.002; // Increased acceleration rate
                let returnSpeed = 0.02; // Increased return speed
                let returnAcceleration = 0.001; // Increased return acceleration

                // Animation function for smooth rotation
                function updateTilt() {
                    if (isTilting) {
                        // Determine if we're returning to center or tilting
                        const isReturning = targetTilt === 0;
                        
                        // Use different speeds and accelerations based on direction
                        const currentSpeed = isReturning ? returnSpeed : tiltSpeed;
                        const currentAcceleration = isReturning ? returnAcceleration : tiltAcceleration;
                        
                        // Calculate the distance to target
                        const distanceToTarget = targetTilt - currentTilt;
                        
                        // Apply stronger easing for initial movement
                        const easingFactor = Math.min(Math.abs(distanceToTarget) * 0.3, 1);
                        
                        // Update current tilt with easing
                        currentTilt += distanceToTarget * currentSpeed * easingFactor;
                        
                        // Apply the tilt to the tilt wrapper
                        tiltWrapper.rotation.z = currentTilt;
                        
                        // Continue animation if we're not close enough to target
                        if (Math.abs(distanceToTarget) > 0.001) {
                            requestAnimationFrame(updateTilt);
                        }
                    }
                }

                window.addEventListener('keydown', (event) => {
                    switch(event.key) {
                        case 'ArrowLeft':
                            targetTilt = maxTilt;
                            isTilting = true;
                            tiltSpeed = 0.05; // Higher initial speed
                            updateTilt();
                            break;
                        case 'ArrowRight':
                            targetTilt = -maxTilt;
                            isTilting = true;
                            tiltSpeed = 0.05; // Higher initial speed
                            updateTilt();
                            break;
                        case ' ':
                            event.preventDefault(); // Prevent spacebar from triggering button
                            if (!isLaserActive) {
                                isLaserActive = true;
                                laserProgress = 0;
                                lastLaserTime = Date.now();
                                
                                // Play laser sound with sound state check
                                playSound(laserSound);
                                
                                // Reset lasers and trails
                                leftLaserBeam.visible = true;
                                rightLaserBeam.visible = true;
                                leftLaserBeam.scale.y = 0.1;
                                rightLaserBeam.scale.y = 0.1;
                                leftLaserBeam.material.opacity = 0.8;
                                rightLaserBeam.material.opacity = 0.8;
                                leftLaserGroup.position.z = 0.5;
                                rightLaserGroup.position.z = 0.5;
                                leftLaserGroup.position.y = -0.6;
                                rightLaserGroup.position.y = -0.6;
                                leftLaserGroup.position.x = -0.3;
                                rightLaserGroup.position.x = 0.3;
                                
                                leftLaserTrail.visible = true;
                                rightLaserTrail.visible = true;
                                for (let i = 0; i < trailParticleCount; i++) {
                                    const i3 = i * 3;
                                    leftTrailPositions[i3] = 0;
                                    leftTrailPositions[i3 + 1] = 0;
                                    leftTrailPositions[i3 + 2] = 0;
                                    rightTrailPositions[i3] = 0;
                                    rightTrailPositions[i3 + 1] = 0;
                                    rightTrailPositions[i3 + 2] = 0;
                                }
                                leftTrailGeometry.attributes.position.needsUpdate = true;
                                rightTrailGeometry.attributes.position.needsUpdate = true;

                                // Create synchronized laser firing animation
                                if (laserTween) laserTween.kill();
                                laserTween = gsap.timeline()
                                    .to([leftLaserBeam.scale, rightLaserBeam.scale], {
                                        y: 1,
                                        duration: 0.1,
                                        ease: "power2.out"
                                    })
                                    .to([leftLaserGroup.position, rightLaserGroup.position], {
                                        z: 20,
                                        duration: 0.3,
                                        ease: "power1.in",
                                        onUpdate: () => {
                                            // Update trail particles for both lasers
                                            for (let i = 0; i < trailParticleCount; i++) {
                                                const i3 = i * 3;
                                                const progress = i / trailParticleCount;
                                                leftTrailPositions[i3] = 0;
                                                leftTrailPositions[i3 + 1] = 0;
                                                leftTrailPositions[i3 + 2] = leftLaserGroup.position.z * (1 - progress);
                                                rightTrailPositions[i3] = 0;
                                                rightTrailPositions[i3 + 1] = 0;
                                                rightTrailPositions[i3 + 2] = rightLaserGroup.position.z * (1 - progress);
                                            }
                                            leftTrailGeometry.attributes.position.needsUpdate = true;
                                            rightTrailGeometry.attributes.position.needsUpdate = true;
                                        }
                                    })
                                    .to([leftLaserBeam.material, rightLaserBeam.material], {
                                        opacity: 0,
                                        duration: 0.1,
                                        onComplete: () => {
                                            isLaserActive = false;
                                            leftLaserBeam.visible = false;
                                            rightLaserBeam.visible = false;
                                            leftLaserTrail.visible = false;
                                            rightLaserTrail.visible = false;
                                            leftLaserGroup.position.z = 1.5;
                                            rightLaserGroup.position.z = 1.5;
                                            leftLaserBeam.material.opacity = 0.8;
                                            rightLaserBeam.material.opacity = 0.8;
                                        }
                                    });
                            }
                            break;
                    }
                });

                // Smoothly return to center when no keys are pressed
                window.addEventListener('keyup', (event) => {
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                        targetTilt = 0;
                        tiltSpeed = 0.02; // Increased from 0.005 for faster return to center
                        // Let the animation function handle the return to center
                    }
                });
            }

            // Mobile controls for ship tilting and laser
            function enableMobileControls() {
                const maxTilt = 1.2; // Same as keyboard controls
                let currentTilt = 0;
                let targetTilt = 0;
                let isTilting = false;
                let tiltSpeed = 0.02;
                let tiltAcceleration = 0.001;
                let returnSpeed = 0.008;
                let returnAcceleration = 0.0004;

                // Check if device supports touch events
                if ('ontouchstart' in window) {
                    // Add touch event listener for firing lasers
                    document.addEventListener('touchstart', (event) => {
                        // Check if the touch target is an interactive element
                        const target = event.target;
                        const isInteractive = target.tagName === 'A' || 
                                            target.tagName === 'BUTTON' || 
                                            target.closest('a') || 
                                            target.closest('button') ||
                                            target.closest('[role="button"]') ||
                                            target.closest('[onclick]') ||
                                            target.closest('[tabindex]');
                        
                        // If it's an interactive element, don't fire the laser
                        if (isInteractive) {
                            return;
                        }
                        
                        event.preventDefault(); // Prevent scrolling when tapping
                        if (!isLaserActive) {
                            isLaserActive = true;
                            laserProgress = 0;
                            lastLaserTime = Date.now();
                            
                            // Play laser sound with sound state check
                            playSound(laserSound);
                            
                            // Reset lasers and trails
                            leftLaserBeam.visible = true;
                            rightLaserBeam.visible = true;
                            leftLaserBeam.scale.y = 0.1;
                            rightLaserBeam.scale.y = 0.1;
                            leftLaserBeam.material.opacity = 0.8;
                            rightLaserBeam.material.opacity = 0.8;
                            leftLaserGroup.position.z = 0.5;
                            rightLaserGroup.position.z = 0.5;
                            leftLaserGroup.position.y = -0.6;
                            rightLaserGroup.position.y = -0.6;
                            leftLaserGroup.position.x = -0.3;
                            rightLaserGroup.position.x = 0.3;
                            
                            leftLaserTrail.visible = true;
                            rightLaserTrail.visible = true;
                            for (let i = 0; i < trailParticleCount; i++) {
                                const i3 = i * 3;
                                leftTrailPositions[i3] = 0;
                                leftTrailPositions[i3 + 1] = 0;
                                leftTrailPositions[i3 + 2] = 0;
                                rightTrailPositions[i3] = 0;
                                rightTrailPositions[i3 + 1] = 0;
                                rightTrailPositions[i3 + 2] = 0;
                            }
                            leftTrailGeometry.attributes.position.needsUpdate = true;
                            rightTrailGeometry.attributes.position.needsUpdate = true;

                            // Create synchronized laser firing animation
                            if (laserTween) laserTween.kill();
                            laserTween = gsap.timeline()
                                .to([leftLaserBeam.scale, rightLaserBeam.scale], {
                                    y: 1,
                                    duration: 0.1,
                                    ease: "power2.out"
                                })
                                .to([leftLaserGroup.position, rightLaserGroup.position], {
                                    z: 20,
                                    duration: 0.3,
                                    ease: "power1.in",
                                    onUpdate: () => {
                                        // Update trail particles for both lasers
                                        for (let i = 0; i < trailParticleCount; i++) {
                                            const i3 = i * 3;
                                            const progress = i / trailParticleCount;
                                            leftTrailPositions[i3] = 0;
                                            leftTrailPositions[i3 + 1] = 0;
                                            leftTrailPositions[i3 + 2] = leftLaserGroup.position.z * (1 - progress);
                                            rightTrailPositions[i3] = 0;
                                            rightTrailPositions[i3 + 1] = 0;
                                            rightTrailPositions[i3 + 2] = rightLaserGroup.position.z * (1 - progress);
                                        }
                                        leftTrailGeometry.attributes.position.needsUpdate = true;
                                        rightTrailGeometry.attributes.position.needsUpdate = true;
                                    }
                                })
                                .to([leftLaserBeam.material, rightLaserBeam.material], {
                                    opacity: 0,
                                    duration: 0.1,
                                    onComplete: () => {
                                        isLaserActive = false;
                                        leftLaserBeam.visible = false;
                                        rightLaserBeam.visible = false;
                                        leftLaserTrail.visible = false;
                                        rightLaserTrail.visible = false;
                                        leftLaserGroup.position.z = 1.5;
                                        rightLaserGroup.position.z = 1.5;
                                        leftLaserBeam.material.opacity = 0.8;
                                        rightLaserBeam.material.opacity = 0.8;
                                    }
                                });
                        }
                    }, { passive: false });

                    // Add accelerometer support for tilt control
                    if (window.DeviceOrientationEvent) {
                        window.addEventListener('deviceorientation', (event) => {
                            // Use beta (front-to-back tilt) for ship tilt
                            if (event.beta !== null) {
                                // Convert beta to radians and scale it
                                const betaRad = event.beta * (Math.PI / 180);
                                // Scale the tilt to match our maxTilt range
                                targetTilt = Math.max(-maxTilt, Math.min(maxTilt, betaRad * 0.05));
                                isTilting = true;
                                updateTilt();
                            }
                        });
                    }
                }
            }

            // Initial state
            camera.position.set(0, 1, -10); // Start below the ship
            camera.lookAt(0, 0, 0);
            tiltWrapper.rotation.z = 0;
            shipAndFlamesGroup.position.z = -40; // Start further away

            // Animation sequence
            timeline
                // Start movement
                .to(shipAndFlamesGroup.position, {
                    duration: 4,
                    z: 0,
                    ease: "power4.out",
                    onUpdate: () => {
                        camera.lookAt(shipAndFlamesGroup.position);
                        
                        // Update ghost positions with slight delay, only in z-axis
                        ghostCopies.forEach((ghost, index) => {
                            const delay = (index + 1) * 0.5; // Increased from 0.2 to 0.5 for wider spacing
                            ghost.position.set(
                                spaceship.position.x, // Same x as main model
                                spaceship.position.y, // Same y as main model
                                spaceship.position.z - delay // Only offset in z
                            );
                            // Keep the same rotation as the main model
                            ghost.rotation.copy(spaceship.rotation);
                        });
                    }
                })
                // Gentle sway counterclockwise
                .to(shipAndFlamesGroup.rotation, {
                    duration: 4,
                    z: -0.1, // Approximately 2 degrees counterclockwise
                    ease: "power4.inOut",
                    onUpdate: () => {
                        // Update ghost rotations to match main model
                        ghostCopies.forEach(ghost => {
                            ghost.rotation.copy(spaceship.rotation);
                        });
                    }
                }, "<")
                // Fade out ghost copies before main rotation
                .to(ghostMaterials, {
                    opacity: 0,
                    duration: 0.5,
                    stagger: 0.1,
                    onComplete: () => {
                        // Remove ghost copies from the scene and dispose materials
                        ghostCopies.forEach((ghost, index) => {
                            // Remove from parent
                            ghost.parent.remove(ghost);
                            // Dispose of materials
                            ghost.traverse((child) => {
                                if (child.isMesh && child.material) {
                                    child.material.dispose();
                                }
                            });
                        });
                        // Clear the arrays
                        ghostCopies.length = 0;
                        ghostMaterials.length = 0;
                    }
                }, "-=0.5") // Start slightly before the sway ends
                // Main rotation - starts immediately after sway
                .to(shipAndFlamesGroup.rotation, {
                    duration: 6,
                    z: Math.PI * 2,
                    ease: "power4.inOut",
                    onUpdate: () => {
                        // Calculate star speed based on rotation progress
                        const rotationProgress = shipAndFlamesGroup.rotation.z / (Math.PI * 2);
                        starSpeedMultiplier = 0.3 + 0.7 * (1 - Math.pow(rotationProgress, 2));
                    }
                }, "-=4") // Start at the same time as the end of the sway
                // Camera movement to final position
                .to(camera.position, {
                    duration: 6,  // Match rotation duration
                    x: 2,  // Closer horizontally
                    y: 1,  // Move up to final height
                    z: 4,  // Much closer to the ship
                    ease: "power4.inOut"
                }, "<") // Start at the same time as rotation
                .to(camera.rotation, {
                    duration: 6,  // Match rotation duration
                    x: -0.2,  // Less extreme pitch
                    y: 0.3,   // Less extreme yaw
                    ease: "power4.inOut",
                    onComplete: () => {
                        // Start the floating animation after the main sequence
                        startShipFloatingAnimation();
                    }
                }, "<");
        },
        function (xhr) {
            console.log('Loading progress:', (xhr.loaded / xhr.total * 100) + '%');
            console.log('Loaded bytes:', xhr.loaded);
            console.log('Total bytes:', xhr.total);
        },
        function (error) {
            console.error('Error loading model:', error);
            console.error('Error details:', {
                type: error.type,
                target: error.target,
                loaded: error.loaded,
                total: error.total
            });
            console.error('Attempted to load from:', modelPath);
            
            // Try alternative path with /sandbox/
            const altPath = '/space-chase/models/spaceship.glb';
            console.log('Trying alternative path:', altPath);
            loader.load(altPath);
        }
    );

    // Animation
    function animate() {
        requestAnimationFrame(animate);

        // Update laser beam and trail
        if (isLaserActive) {
            const currentTime = Date.now();
            const deltaTime = (currentTime - lastLaserTime) / 1000;
            lastLaserTime = currentTime;
            
            laserProgress += deltaTime;
            
            if (laserProgress < laserDuration) {
                // Update trail particle colors based on distance
                const colors = leftTrailGeometry.attributes.color.array;
                for (let i = 0; i < trailParticleCount; i++) {
                    const i3 = i * 3;
                    const progress = i / trailParticleCount;
                    const color = new THREE.Color(0x00ffff);
                    color.multiplyScalar(1 - progress);
                    colors[i3] = color.r;
                    colors[i3 + 1] = color.g;
                    colors[i3 + 2] = color.b;
                }
                leftTrailGeometry.attributes.color.needsUpdate = true;
            }
        }

        // Update starfield
        for (let i = 0; i < starCount; i++) {
            const star = starGroup.children[i];
            
            // Move stars toward camera using the speed multiplier
            star.position.z -= starVelocities[i] * starSpeedMultiplier;
            
            // Reset stars that have moved past the camera
            if (star.position.z < -50) {
                const radius = Math.random() * 100 + 50;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI * 2;
                
                star.position.x = radius * Math.sin(phi) * Math.cos(theta);
                star.position.y = radius * Math.sin(phi) * Math.sin(theta);
                star.position.z = radius * Math.cos(phi);
                starVelocities[i] = Math.random() * 4 + 2; // Reset to original speed range
            }
        }

        // Update flame particles
        if (spaceshipGroup) {
            const positions = flameGeometry.attributes.position.array;
            const colors = flameGeometry.attributes.color.array;
            
            for (let i = 0; i < flameParticleCount; i++) {
                const i3 = i * 3;
                
                // Move particles backward
                positions[i3 + 2] -= flameVelocities[i];
                
                // Fade out particles as they move away
                const distance = Math.abs(positions[i3 + 2]);
                const alpha = Math.max(0, 1 - distance / 4);
                colors[i3] *= alpha;
                colors[i3 + 1] *= alpha;
                colors[i3 + 2] *= alpha;
                
                // Reset particles that have moved too far
                if (positions[i3 + 2] < -4) {
                    positions[i3 + 2] = -1.0; // Reset to initial position (20% closer)
                    colors[i3] = 1;
                    colors[i3 + 1] = 0.5;
                    colors[i3 + 2] = 0;
                    flameVelocities[i] = Math.random() * 0.1 + 0.05;
                }
            }
            
            flameGeometry.attributes.position.needsUpdate = true;
            flameGeometry.attributes.color.needsUpdate = true;
        }

        // Update TIE fighter laser beam and trail
        if (isTieLaserActive) {
            const currentTime = Date.now();
            const deltaTime = (currentTime - lastTieLaserTime) / 1000;
            lastTieLaserTime = currentTime;
            
            tieLaserProgress += deltaTime;
            
            if (tieLaserProgress < laserDuration) {
                // Update trail particle colors based on distance
                const colors = tieTrailGeometry.attributes.color.array;
                for (let i = 0; i < tieTrailParticleCount; i++) {
                    const i3 = i * 3;
                    const progress = i / tieTrailParticleCount;
                    const color = new THREE.Color(0xff0000);
                    color.multiplyScalar(1 - progress);
                    colors[i3] = color.r;
                    colors[i3 + 1] = color.g;
                    colors[i3 + 2] = color.b;
                }
                tieTrailGeometry.attributes.color.needsUpdate = true;
            }
        }

        // Update controls in animation loop
        controls.update();

        renderer.render(scene, camera);
    }
    animate();

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        controls.update();
    }

    // Function to create smooth floating animation for the main ship
    function startShipFloatingAnimation() {
        // Create a timeline for continuous floating motion
        const floatingAnimation = gsap.timeline({
            repeat: -1,
            yoyo: true
        });

        // Add multiple tweens for organic movement
        floatingAnimation
            // Vertical movement (up and down) with pitch
            .to(floatingWrapper.position, {
                y: 0.3, // Subtle upward movement
                duration: 4,
                ease: "sine.inOut"
            })
            .to(floatingWrapper.rotation, {
                x: 0.05, // Slight nose up as it climbs
                duration: 4,
                ease: "sine.inOut"
            }, "<")
            // Horizontal movement (port to starboard) with banking
            .to(floatingWrapper.position, {
                x: 0.2, // Subtle side movement
                duration: 5,
                ease: "sine.inOut"
            }, "<")
            // Banking (roll) as it moves
            .to(floatingWrapper.rotation, {
                z: 0.05, // Subtle banking
                duration: 5,
                ease: "sine.inOut"
            }, "<")
            // Move down and to port with pitch
            .to(floatingWrapper.position, {
                y: -0.3,
                x: -0.2,
                duration: 5,
                ease: "sine.inOut"
            })
            .to(floatingWrapper.rotation, {
                x: -0.05,
                duration: 5,
                ease: "sine.inOut"
            }, "<")
            // Bank left as it moves left
            .to(floatingWrapper.rotation, {
                z: -0.05,
                duration: 5,
                ease: "sine.inOut"
            }, "<")
            // Return to original position and rotation
            .to(floatingWrapper.position, {
                y: 0,
                x: 0,
                duration: 4,
                ease: "sine.inOut"
            })
            .to(floatingWrapper.rotation, {
                x: 0,
                z: 0,
                duration: 4,
                ease: "sine.inOut"
            }, "<");
    }
});
