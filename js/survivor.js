// --- GAME CONFIGURATION ---
const ROAD_WIDTH = 40;
const ROAD_LENGTH = 10000;
const PLAYER_SPEED = 0.3;
const ZOMBIE_SPEED_BASE = 0.08;
const ROCKET_SPEED = 2.5;
const PLAYER_LIMIT_X = 18;

// --- GLOBALS ---
let scene, camera, renderer;
let player, playerMesh, weaponMesh;
let zombies = [];
let rockets = [];
let particles = [];
let buildings = [];

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const aimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.5);

let score = 0;
let isGameOver = false;
let lastTime = 0;
let lastSpawnTime = 0;

const keys = { w: false, a: false, s: false, d: false, space: false };
const wrapper = document.getElementById('game-wrapper'); // Reference to container

// --- INIT ---
function init() {
    const container = document.getElementById('canvas-container');

    // Scene setup
    scene = new THREE.Scene();
    // Use a darker, sci-fi fog color to match theme (dark grey/blue)
    scene.background = new THREE.Color(0x161b22);
    scene.fog = new THREE.Fog(0x161b22, 20, 120);

    camera = new THREE.PerspectiveCamera(60, wrapper.clientWidth / wrapper.clientHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(wrapper.clientWidth, wrapper.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8); // Softer ambient
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00ff9d, 0.6); // Cyber Green Sun
    dirLight.position.set(-50, 100, -50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    scene.add(dirLight);

    createWorld();
    createPlayer();

    // Listeners
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('keydown', (e) => handleKey(e, true));
    document.addEventListener('keyup', (e) => handleKey(e, false));

    // Mouse click to shoot (only if clicking on canvas)
    container.addEventListener('mousedown', shootRocket);

    document.getElementById('restart-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        restartGame();
    });

    requestAnimationFrame(animate);
}

// --- ASSETS ---
function createWorld() {
    // Road
    const roadGeo = new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_LENGTH);
    const roadMat = new THREE.MeshPhongMaterial({ color: 0x0a0a0a }); // Very dark road
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.z = -ROAD_LENGTH / 2 + 50;
    road.receiveShadow = true;
    scene.add(road);

    // Neon Lines (Checkpoints)
    const lineGeo = new THREE.PlaneGeometry(ROAD_WIDTH, 0.5);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x00ff9d }); // Theme Accent Color

    for (let i = 100; i < ROAD_LENGTH; i += 100) {
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(0, 0.02, -i);
        scene.add(line);
    }

    // Ground
    const groundGeo = new THREE.PlaneGeometry(500, ROAD_LENGTH);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x0d1117 }); // Surface color
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.position.z = -ROAD_LENGTH / 2 + 50;
    scene.add(ground);

    // Buildings (Cyberpunk Skyscrapers)
    const buildingColors = [0x222222, 0x333333, 0x111111];

    for (let z = 20; z > -1000; z -= (15 + Math.random() * 20)) {
        createBuilding(-25 - Math.random() * 10, z, buildingColors);
        createBuilding(25 + Math.random() * 10, z, buildingColors);
    }
}

function createBuilding(x, z, colors) {
    const h = 10 + Math.random() * 30; // Taller buildings
    const w = 5 + Math.random() * 5;
    const d = 5 + Math.random() * 5;

    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshLambertMaterial({
        color: colors[Math.floor(Math.random() * colors.length)]
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Add neon window detail (optional simple emissive block)
    if (Math.random() > 0.7) {
        const winGeo = new THREE.BoxGeometry(w + 0.1, 1, d + 0.1);
        const winMat = new THREE.MeshBasicMaterial({ color: 0xff00ff }); // Magenta windows
        const win = new THREE.Mesh(winGeo, winMat);
        win.position.set(x, h / 2 + 5, z);
        scene.add(win);
    }

    scene.add(mesh);
    buildings.push(mesh);
}

function createPlayer() {
    const group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(1.5, 3, 1.5);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x00ff9d }); // Player is accent color
    playerMesh = new THREE.Mesh(bodyGeo, bodyMat);
    playerMesh.position.y = 1.5;
    playerMesh.castShadow = true;
    group.add(playerMesh);

    // Launcher
    const launcherGeo = new THREE.CylinderGeometry(0.3, 0.3, 2.5, 8);
    const launcherMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    weaponMesh = new THREE.Mesh(launcherGeo, launcherMat);
    weaponMesh.rotation.x = Math.PI / 2;
    weaponMesh.position.set(0.8, 2.8, 0.5);
    group.add(weaponMesh);

    group.position.set(0, 0, 0);
    scene.add(group);
    player = { mesh: group, canShoot: true, cooldown: 0 };
}

function spawnEnemy() {
    if (isGameOver) return;
    const group = new THREE.Group();

    // Zombie
    const geo = new THREE.BoxGeometry(1.5, 3, 1.5);
    const mat = new THREE.MeshLambertMaterial({ color: 0xff5f56 }); // Red Enemies
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 1.5;
    mesh.castShadow = true;
    group.add(mesh);

    // Arms
    const armGeo = new THREE.BoxGeometry(1.5, 0.4, 0.4);
    const armMesh = new THREE.Mesh(armGeo, mat);
    armMesh.position.set(0, 2.5, 0.5);
    group.add(armMesh);

    const spawnX = (Math.random() * 36) - 18;
    const spawnZ = player.mesh.position.z - (60 + Math.random() * 20);

    group.position.set(spawnX, 0, spawnZ);
    scene.add(group);

    const speed = ZOMBIE_SPEED_BASE + (score * 0.0001);
    zombies.push({ mesh: group, speed: Math.min(speed, 0.35) });
}

function shootRocket() {
    if (!player.canShoot || isGameOver) return;

    // Raycast using wrapper dimensions logic
    raycaster.setFromCamera(mouse, camera);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(aimPlane, target);

    if (!target) return;

    const weaponWorldPos = new THREE.Vector3();
    weaponMesh.getWorldPosition(weaponWorldPos);

    const direction = new THREE.Vector3();
    direction.subVectors(target, weaponWorldPos).normalize();

    const rocketGeo = new THREE.ConeGeometry(0.2, 1, 8);
    rocketGeo.rotateX(Math.PI / 2);
    const rocketMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const rocket = new THREE.Mesh(rocketGeo, rocketMat);

    rocket.position.copy(weaponWorldPos);
    rocket.lookAt(target);

    scene.add(rocket);
    rockets.push({ mesh: rocket, velocity: direction.multiplyScalar(ROCKET_SPEED), life: 150 });

    player.canShoot = false;
    player.cooldown = 15;
}

function createExplosion(position) {
    for (let i = 0; i < 8; i++) {
        const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const p = new THREE.Mesh(geo, mat);
        p.position.copy(position);

        const vel = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5
        );

        scene.add(p);
        particles.push({ mesh: p, velocity: vel, life: 30 });
    }
}

// --- UTILS ---
function onMouseMove(event) {
    // Need to calculate mouse relative to the canvas, not the window, because of the Nav bar
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function handleKey(e, pressed) {
    const k = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright', ' '].includes(k)) {
        // Prevent scrolling if focused
        // e.preventDefault(); 
    }

    if (k === 'w' || k === 'arrowup') keys.w = pressed;
    if (k === 'a' || k === 'arrowleft') keys.a = pressed;
    if (k === 's' || k === 'arrowdown') keys.s = pressed;
    if (k === 'd' || k === 'arrowright') keys.d = pressed;
    if (k === ' ') {
        if (pressed && !keys.space) shootRocket();
        keys.space = pressed;
    }
}

function onWindowResize() {
    camera.aspect = wrapper.clientWidth / wrapper.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(wrapper.clientWidth, wrapper.clientHeight);
}

// --- MAIN LOOP ---
function animate(time) {
    requestAnimationFrame(animate);
    if (isGameOver) return;

    const delta = time - lastTime;
    lastTime = time;

    const difficultyMultiplier = Math.floor(score / 100);
    const currentSpawnRate = Math.max(500, 2500 - (difficultyMultiplier * 300));

    if (time - lastSpawnTime > currentSpawnRate) {
        spawnEnemy();
        lastSpawnTime = time;
    }

    if (keys.w) player.mesh.position.z -= PLAYER_SPEED;
    if (keys.s) player.mesh.position.z += PLAYER_SPEED;

    const distance = Math.floor(Math.max(0, -player.mesh.position.z));
    if (distance > score) {
        score = distance;
        document.getElementById('score-val').innerText = score;
    }

    if (keys.a) player.mesh.position.x -= PLAYER_SPEED;
    if (keys.d) player.mesh.position.x += PLAYER_SPEED;
    player.mesh.position.x = Math.max(-PLAYER_LIMIT_X, Math.min(PLAYER_LIMIT_X, player.mesh.position.x));

    // Camera Follow
    const targetCamZ = player.mesh.position.z + 25;
    const targetCamX = player.mesh.position.x * 0.5;
    camera.position.z = targetCamZ;
    camera.position.y = 12;
    camera.position.x += (targetCamX - camera.position.x) * 0.1;
    camera.lookAt(player.mesh.position.x, 2, player.mesh.position.z - 20);

    // Cooldowns
    if (player.cooldown > 0) player.cooldown--;
    else player.canShoot = true;

    // Projectiles
    for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.life--;
        r.mesh.position.add(r.velocity);

        if (r.life <= 0) {
            scene.remove(r.mesh);
            rockets.splice(i, 1);
            continue;
        }

        let hit = false;
        for (let j = zombies.length - 1; j >= 0; j--) {
            const z = zombies[j];
            if (r.mesh.position.distanceTo(z.mesh.position) < 3) {
                createExplosion(z.mesh.position);
                scene.remove(z.mesh);
                zombies.splice(j, 1);
                hit = true;
                break;
            }
        }
        if (hit) {
            scene.remove(r.mesh);
            rockets.splice(i, 1);
        }
    }

    // Zombies
    for (let i = 0; i < zombies.length; i++) {
        const z = zombies[i];
        z.mesh.position.z += z.speed;
        if (z.mesh.position.x < player.mesh.position.x) z.mesh.position.x += 0.05;
        if (z.mesh.position.x > player.mesh.position.x) z.mesh.position.x -= 0.05;
        z.mesh.lookAt(player.mesh.position);

        if (z.mesh.position.distanceTo(player.mesh.position) < 2) {
            endGame();
        }

        if (z.mesh.position.z > player.mesh.position.z + 10) {
            scene.remove(z.mesh);
            zombies.splice(i, 1);
            i--;
        }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life--;
        p.mesh.position.add(p.velocity);
        p.mesh.scale.multiplyScalar(0.9);
        if (p.life <= 0) {
            scene.remove(p.mesh);
            particles.splice(i, 1);
        }
    }

    // Update Light for shadows
    const light = scene.children.find(c => c.isDirectionalLight);
    if (light) {
        light.position.z = player.mesh.position.z + 50;
        light.target.position.z = player.mesh.position.z - 50;
        light.target.updateMatrixWorld();
    }

    renderer.render(scene, camera);
}

function endGame() {
    isGameOver = true;
    document.getElementById('game-over-screen').classList.add('visible');
    document.getElementById('final-score').innerText = score;
}

function restartGame() {
    score = 0;
    document.getElementById('score-val').innerText = '0';
    isGameOver = false;

    zombies.forEach(z => scene.remove(z.mesh));
    zombies = [];
    rockets.forEach(r => scene.remove(r.mesh));
    rockets = [];
    particles.forEach(p => scene.remove(p.mesh));
    particles = [];

    player.mesh.position.set(0, 0, 0);
    document.getElementById('game-over-screen').classList.remove('visible');
    lastTime = performance.now();
    requestAnimationFrame(animate);
}

// Start the game
init();
