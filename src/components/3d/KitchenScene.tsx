import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GraphicQuality } from '../../types/game';

interface KitchenSceneProps {
  waterLevel: number; // 0 to 100
  isTapOpen: boolean;
  isOverflowed: boolean;
  quality: GraphicQuality;
  isCriticalTension?: boolean;
}

// Pre-allocated reusable helpers for zero-GC render loop
const _tmpVec3 = new THREE.Vector3();

export const KitchenScene: React.FC<KitchenSceneProps> = ({
  waterLevel,
  isTapOpen,
  isOverflowed,
  quality,
  isCriticalTension = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // References to dynamic scene objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const waterSurfaceRef = useRef<THREE.Mesh | null>(null);
  const faucetLeverRef = useRef<THREE.Group | null>(null);
  const waterStreamRef = useRef<THREE.Mesh | null>(null);
  const splashParticlesRef = useRef<THREE.Points | null>(null);
  const overflowParticlesRef = useRef<THREE.Points | null>(null);

  // Mutable state refs to avoid recreating scene on prop changes
  const targetWaterLevelRef = useRef<number>(waterLevel);
  const currentWaterLevelRef = useRef<number>(waterLevel);
  const isTapOpenRef = useRef<boolean>(isTapOpen);
  const isOverflowedRef = useRef<boolean>(isOverflowed);
  const isTenseRef = useRef<boolean>(isCriticalTension);

  targetWaterLevelRef.current = waterLevel;
  isTapOpenRef.current = isTapOpen;
  isOverflowedRef.current = isOverflowed;
  isTenseRef.current = isCriticalTension;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // --- 1. SCENE SETUP ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0f172a); // Deep slate background
    scene.fog = new THREE.FogExp2(0x0f172a, 0.08);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    camera.position.set(0, 2.6, 4.2);
    camera.lookAt(0, 1.25, 0);
    cameraRef.current = camera;

    // --- 2. RENDERER SETUP ---
    const renderer = new THREE.WebGLRenderer({
      antialias: quality !== 'low',
      powerPreference: 'high-performance',
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);

    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    const maxRatio = quality === 'low' || isHeadless ? 1 : quality === 'medium' ? 1.5 : 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxRatio));

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    if (quality !== 'low' && !isHeadless) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    } else {
      renderer.shadowMap.enabled = false;
    }

    container.appendChild(renderer.domElement);

    // --- 3. STUDIO LIGHTING & PROCEDURAL ENVIRONMENT ---
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Warm key light
    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.8);
    keyLight.position.set(2.5, 5.0, 3.2);
    if (renderer.shadowMap.enabled) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = quality === 'high' ? 2048 : 1024;
      keyLight.shadow.mapSize.height = quality === 'high' ? 2048 : 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 12;
      keyLight.shadow.camera.left = -2;
      keyLight.shadow.camera.right = 2;
      keyLight.shadow.camera.top = 3.5;
      keyLight.shadow.camera.bottom = -0.5;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    // Cool hemisphere fill
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 1.2);
    hemiLight.position.set(0, 6, 0);
    scene.add(hemiLight);

    // Soft rim back-light for glass silhouette highlights
    const rimLight = new THREE.DirectionalLight(0x60a5fa, 1.6);
    rimLight.position.set(-3, 3, -3);
    scene.add(rimLight);

    // --- 4. PROCEDURAL TEXTURES (ZERO 404s) ---
    // Luxury Quartz / Marble Countertop Texture
    const counterCanvas = document.createElement('canvas');
    counterCanvas.width = 512;
    counterCanvas.height = 512;
    const ctx = counterCanvas.getContext('2d')!;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 512, 0);
      ctx.bezierCurveTo(
        Math.random() * 512, 180,
        Math.random() * 512, 340,
        Math.random() * 512, 512
      );
      ctx.stroke();
    }
    const counterTexture = new THREE.CanvasTexture(counterCanvas);
    counterTexture.colorSpace = THREE.SRGBColorSpace;
    counterTexture.wrapS = THREE.RepeatWrapping;
    counterTexture.wrapT = THREE.RepeatWrapping;
    counterTexture.repeat.set(2, 2);
    counterTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // Backsplash Wall Tile Texture
    const wallCanvas = document.createElement('canvas');
    wallCanvas.width = 256;
    wallCanvas.height = 256;
    const wCtx = wallCanvas.getContext('2d')!;
    wCtx.fillStyle = '#0f172a';
    wCtx.fillRect(0, 0, 256, 256);
    wCtx.strokeStyle = '#1e293b';
    wCtx.lineWidth = 2;
    for (let y = 0; y <= 256; y += 32) {
      wCtx.beginPath();
      wCtx.moveTo(0, y);
      wCtx.lineTo(256, y);
      wCtx.stroke();
    }
    for (let row = 0; row < 8; row++) {
      const offsetX = (row % 2) * 32;
      for (let x = offsetX; x <= 256; x += 64) {
        wCtx.beginPath();
        wCtx.moveTo(x, row * 32);
        wCtx.lineTo(x, (row + 1) * 32);
        wCtx.stroke();
      }
    }
    const wallTexture = new THREE.CanvasTexture(wallCanvas);
    wallTexture.colorSpace = THREE.SRGBColorSpace;
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(6, 4);

    // --- 5. COMPOSITE KITCHEN ENVIRONMENT ---
    const counterGeo = new THREE.BoxGeometry(7, 0.4, 4);
    const counterMat = new THREE.MeshStandardMaterial({
      map: counterTexture,
      roughness: 0.25,
      metalness: 0.1,
    });
    const counterMesh = new THREE.Mesh(counterGeo, counterMat);
    counterMesh.position.set(0, -0.2, 0);
    counterMesh.receiveShadow = true;
    scene.add(counterMesh);

    const sinkGeo = new THREE.BoxGeometry(2.4, 0.15, 2.0);
    const sinkMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.15,
    });
    const sinkMesh = new THREE.Mesh(sinkGeo, sinkMat);
    sinkMesh.position.set(0, 0.01, 0);
    sinkMesh.receiveShadow = true;
    scene.add(sinkMesh);

    const drainGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.02, 24);
    const drainMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.95,
      roughness: 0.3,
    });
    const drainMesh = new THREE.Mesh(drainGeo, drainMat);
    drainMesh.position.set(0, 0.09, -0.4);
    scene.add(drainMesh);

    const wallGeo = new THREE.PlaneGeometry(12, 6);
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTexture,
      roughness: 0.6,
      metalness: 0.05,
    });
    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    wallMesh.position.set(0, 2.5, -2.0);
    wallMesh.receiveShadow = true;
    scene.add(wallMesh);

    // --- 6. COMPOSITE CHROME FAUCET ---
    const faucetGroup = new THREE.Group();
    faucetGroup.position.set(0, 0.08, -0.75);

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.98,
      roughness: 0.08,
    });

    const baseGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.12, 32);
    const baseMesh = new THREE.Mesh(baseGeo, chromeMat);
    baseMesh.position.y = 0.06;
    baseMesh.castShadow = true;
    faucetGroup.add(baseMesh);

    const riserGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.3, 32);
    const riserMesh = new THREE.Mesh(riserGeo, chromeMat);
    riserMesh.position.y = 0.72;
    riserMesh.castShadow = true;
    faucetGroup.add(riserMesh);

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.35, 0),
      new THREE.Vector3(0, 2.45, 0.08),
      new THREE.Vector3(0, 2.4, 0.55),
      new THREE.Vector3(0, 2.05, 0.75),
    ]);
    const gooseneckGeo = new THREE.TubeGeometry(curve, 40, 0.075, 20, false);
    const gooseneckMesh = new THREE.Mesh(gooseneckGeo, chromeMat);
    gooseneckMesh.castShadow = true;
    faucetGroup.add(gooseneckMesh);

    const aeratorGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.18, 28);
    const aeratorMesh = new THREE.Mesh(aeratorGeo, chromeMat);
    aeratorMesh.position.set(0, 1.95, 0.75);
    aeratorMesh.castShadow = true;
    faucetGroup.add(aeratorMesh);

    const nozzleFaceGeo = new THREE.CircleGeometry(0.075, 20);
    const nozzleFaceMat = new THREE.MeshBasicMaterial({ color: 0x111827, side: THREE.DoubleSide });
    const nozzleFaceMesh = new THREE.Mesh(nozzleFaceGeo, nozzleFaceMat);
    nozzleFaceMesh.rotation.x = Math.PI / 2;
    nozzleFaceMesh.position.set(0, 1.86, 0.75);
    faucetGroup.add(nozzleFaceMesh);

    const leverBaseGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.12, 24);
    const leverBaseMesh = new THREE.Mesh(leverBaseGeo, chromeMat);
    leverBaseMesh.rotation.z = Math.PI / 2;
    leverBaseMesh.position.set(0.12, 0.5, 0);
    faucetGroup.add(leverBaseMesh);

    const leverPivot = new THREE.Group();
    leverPivot.position.set(0.18, 0.5, 0);

    const leverStickGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.4, 16);
    const leverStickMesh = new THREE.Mesh(leverStickGeo, chromeMat);
    leverStickMesh.position.y = 0.2;
    leverStickMesh.castShadow = true;
    leverPivot.add(leverStickMesh);

    const leverBallGeo = new THREE.SphereGeometry(0.045, 16, 16);
    const leverBallMesh = new THREE.Mesh(leverBallGeo, chromeMat);
    leverBallMesh.position.y = 0.4;
    leverPivot.add(leverBallMesh);

    faucetGroup.add(leverPivot);
    faucetLeverRef.current = leverPivot;
    scene.add(faucetGroup);

    // --- 7. REALISTIC GLASS CUP ---
    const cupGroup = new THREE.Group();
    cupGroup.position.set(0, 0.08, 0);

    // Soft Radial Contact Shadow (تم رفع الارتفاع لمنع الوشة والتداخل)
    const shadowGeo = new THREE.PlaneGeometry(1.4, 1.4);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d')!;
    const grad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0,0,0,0.65)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.25)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 128, 128);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.65,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.015; // مرتفعة قليلاً لتجنب Z-fighting
    shadowMesh.renderOrder = 1;
    cupGroup.add(shadowMesh);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.94,
      opacity: 1.0,
      transparent: true,
      roughness: 0.04,
      metalness: 0.05,
      ior: 1.52,
      thickness: 0.4,
      attenuationColor: new THREE.Color(0xdbeafe),
      attenuationDistance: 2.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      depthWrite: false,
    });

    const glassPoints: THREE.Vector2[] = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.38, 0.0),
      new THREE.Vector2(0.42, 0.08),
      new THREE.Vector2(0.45, 0.4),
      new THREE.Vector2(0.5, 1.0),
      new THREE.Vector2(0.53, 1.48),
      new THREE.Vector2(0.51, 1.49),
      new THREE.Vector2(0.48, 1.48),
      new THREE.Vector2(0.45, 1.0),
      new THREE.Vector2(0.4, 0.4),
      new THREE.Vector2(0.36, 0.12),
      new THREE.Vector2(0.0, 0.12),
    ];
    const glassGeo = new THREE.LatheGeometry(glassPoints, 36);
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.castShadow = true;
    glassMesh.receiveShadow = true;
    cupGroup.add(glassMesh);

    const maxWaterHeight = 1.34;
    const waterBaseY = 0.13;

    const waterGeo = new THREE.CylinderGeometry(0.48, 0.38, maxWaterHeight, 32, 1, false);
    waterGeo.translate(0, maxWaterHeight / 2, 0);

    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transmission: 0.88,
      transparent: true,
      opacity: 0.9,
      roughness: 0.08,
      metalness: 0.1,
      ior: 1.333,
      attenuationColor: new THREE.Color(0x0284c7),
      attenuationDistance: 0.9,
    });

    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.set(0, waterBaseY, 0);
    waterMesh.scale.set(1, 0.001, 1);
    cupGroup.add(waterMesh);
    waterMeshRef.current = waterMesh;

    const surfaceGeo = new THREE.CircleGeometry(0.47, 32);
    const surfaceMat = new THREE.MeshPhysicalMaterial({
      color: 0x7dd3fc,
      transmission: 0.75,
      transparent: true,
      roughness: 0.05,
      metalness: 0.2,
      clearcoat: 1.0,
      side: THREE.DoubleSide,
    });
    const surfaceMesh = new THREE.Mesh(surfaceGeo, surfaceMat);
    surfaceMesh.rotation.x = -Math.PI / 2;
    surfaceMesh.position.set(0, waterBaseY, 0);
    surfaceMesh.visible = false;
    cupGroup.add(surfaceMesh);
    waterSurfaceRef.current = surfaceMesh;

    scene.add(cupGroup);

    // --- 8. WATER STREAM ---
    const streamGeo = new THREE.CylinderGeometry(0.035, 0.045, 1.8, 16);
    const streamMat = new THREE.MeshPhysicalMaterial({
      color: 0xbae6fd,
      transmission: 0.9,
      transparent: true,
      opacity: 0.85,
      roughness: 0.06,
      ior: 1.333,
      clearcoat: 1.0,
    });
    const streamMesh = new THREE.Mesh(streamGeo, streamMat);
    streamMesh.position.set(0, 1.0, 0);
    streamMesh.scale.set(1, 0.0001, 1);
    streamMesh.visible = false;
    scene.add(streamMesh);
    waterStreamRef.current = streamMesh;

    // --- 9. SPLASH PARTICLES ---
    const particleCount = quality === 'low' ? 30 : quality === 'medium' ? 70 : 120;
    const splashGeo = new THREE.BufferGeometry();
    const splashPositions = new Float32Array(particleCount * 3);
    const splashVelocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      splashPositions[i * 3] = 0;
      splashPositions[i * 3 + 1] = 0;
      splashPositions[i * 3 + 2] = 0;

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 0.9;
      splashVelocities[i * 3] = Math.cos(angle) * speed;
      splashVelocities[i * 3 + 1] = 0.8 + Math.random() * 1.2;
      splashVelocities[i * 3 + 2] = Math.sin(angle) * speed;
    }

    splashGeo.setAttribute('position', new THREE.BufferAttribute(splashPositions, 3));

    const pCanvas = document.createElement('canvas');
    pCanvas.width = 64;
    pCanvas.height = 64;
    const pCtx = pCanvas.getContext('2d')!;
    const pGrad = pCtx.createRadialGradient(32, 32, 4, 32, 32, 30);
    pGrad.addColorStop(0, 'rgba(224, 242, 254, 1.0)');
    pGrad.addColorStop(0.6, 'rgba(125, 211, 252, 0.6)');
    pGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    pCtx.fillStyle = pGrad;
    pCtx.fillRect(0, 0, 64, 64);
    const pTex = new THREE.CanvasTexture(pCanvas);

    const splashMat = new THREE.PointsMaterial({
      size: 0.08,
      map: pTex,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const splashParticles = new THREE.Points(splashGeo, splashMat);
    splashParticles.visible = false;
    scene.add(splashParticles);
    splashParticlesRef.current = splashParticles;

    // --- 10. OVERFLOW PARTICLES ---
    const overflowCount = quality === 'low' ? 60 : 150;
    const overflowGeo = new THREE.BufferGeometry();
    const overflowPositions = new Float32Array(overflowCount * 3);
    const overflowVelocities = new Float32Array(overflowCount * 3);

    for (let i = 0; i < overflowCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.52;
      overflowPositions[i * 3] = Math.cos(angle) * r;
      overflowPositions[i * 3 + 1] = 1.55;
      overflowPositions[i * 3 + 2] = Math.sin(angle) * r;

      overflowVelocities[i * 3] = Math.cos(angle) * (0.3 + Math.random() * 0.4);
      overflowVelocities[i * 3 + 1] = -1.2 - Math.random() * 1.5;
      overflowVelocities[i * 3 + 2] = Math.sin(angle) * (0.3 + Math.random() * 0.4);
    }
    overflowGeo.setAttribute('position', new THREE.BufferAttribute(overflowPositions, 3));
    const overflowPoints = new THREE.Points(overflowGeo, splashMat.clone());
    overflowPoints.visible = false;
    scene.add(overflowPoints);
    overflowParticlesRef.current = overflowPoints;

    renderer.compile(scene, camera);

    // --- 11. ANIMATION TICK LOOP ---
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      const targetLevel = targetWaterLevelRef.current;
      if (isTapOpenRef.current) {
        currentWaterLevelRef.current = THREE.MathUtils.damp(
          currentWaterLevelRef.current,
          targetLevel,
          20.0,
          delta
        );
      } else {
        currentWaterLevelRef.current = targetLevel;
      }

      const levelFraction = Math.max(0.0001, Math.min(1.0, currentWaterLevelRef.current / 100));

      if (waterMeshRef.current) {
        waterMeshRef.current.scale.y = levelFraction;
        const meshMat = waterMeshRef.current.material as THREE.MeshPhysicalMaterial;
        meshMat.color.setHSL(0.55, 0.85, 0.65 - levelFraction * 0.15);
      }

      const currentSurfaceY = waterBaseY + maxWaterHeight * levelFraction;
      if (waterSurfaceRef.current) {
        waterSurfaceRef.current.position.y = currentSurfaceY;
        waterSurfaceRef.current.visible = currentWaterLevelRef.current > 0.5;

        if (isTapOpenRef.current) {
          waterSurfaceRef.current.rotation.z = Math.sin(elapsed * 12) * 0.02;
          waterSurfaceRef.current.scale.setScalar(1.0 + Math.sin(elapsed * 15) * 0.03);
        } else {
          waterSurfaceRef.current.rotation.z = 0;
          waterSurfaceRef.current.scale.setScalar(1.0);
        }
      }

      if (faucetLeverRef.current) {
        const targetRot = isTapOpenRef.current ? -0.6 : 0.0;
        faucetLeverRef.current.rotation.z = THREE.MathUtils.damp(
          faucetLeverRef.current.rotation.z,
          targetRot,
          15.0,
          delta
        );
      }

      if (waterStreamRef.current) {
        if (isTapOpenRef.current) {
          waterStreamRef.current.visible = true;
          const nozzleY = 1.86;
          const streamLength = Math.max(0.1, nozzleY - currentSurfaceY);
          const streamCenterY = currentSurfaceY + streamLength / 2;

          waterStreamRef.current.scale.y = streamLength / 1.8;
          waterStreamRef.current.position.y = streamCenterY;

          const wobble = 1.0 + Math.sin(elapsed * 35) * 0.06;
          waterStreamRef.current.scale.x = wobble;
          waterStreamRef.current.scale.z = wobble;
        } else {
          waterStreamRef.current.visible = false;
        }
      }

      if (splashParticlesRef.current) {
        if (isTapOpenRef.current && currentWaterLevelRef.current > 1) {
          splashParticlesRef.current.visible = true;
          splashParticlesRef.current.position.set(0, currentSurfaceY, 0);

          const positions = splashParticlesRef.current.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < particleCount; i++) {
            positions[i * 3 + 1] += splashVelocities[i * 3 + 1] * delta * 0.6;
            positions[i * 3] += splashVelocities[i * 3] * delta * 0.5;
            positions[i * 3 + 2] += splashVelocities[i * 3 + 2] * delta * 0.5;

            if (positions[i * 3 + 1] > 0.35 || Math.random() < 0.08) {
              positions[i * 3] = (Math.random() - 0.5) * 0.08;
              positions[i * 3 + 1] = 0;
              positions[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
            }
          }
          splashParticlesRef.current.geometry.attributes.position.needsUpdate = true;
        } else {
          splashParticlesRef.current.visible = false;
        }
      }

      if (overflowParticlesRef.current) {
        if (isOverflowedRef.current) {
          overflowParticlesRef.current.visible = true;
          const pos = overflowParticlesRef.current.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < overflowCount; i++) {
            pos[i * 3] += overflowVelocities[i * 3] * delta;
            pos[i * 3 + 1] += overflowVelocities[i * 3 + 1] * delta;
            pos[i * 3 + 2] += overflowVelocities[i * 3 + 2] * delta;

            if (pos[i * 3 + 1] < 0.08) {
              const angle = Math.random() * Math.PI * 2;
              const r = 0.52 + Math.random() * 0.06;
              pos[i * 3] = Math.cos(angle) * r;
              pos[i * 3 + 1] = 1.55;
              pos[i * 3 + 2] = Math.sin(angle) * r;
            }
          }
          overflowParticlesRef.current.geometry.attributes.position.needsUpdate = true;
        } else {
          overflowParticlesRef.current.visible = false;
        }
      }

      if (cameraRef.current) {
        const targetCamZ = isTenseRef.current || currentWaterLevelRef.current > 75 ? 3.4 : 4.2;
        const targetCamY = isTenseRef.current || currentWaterLevelRef.current > 75 ? 2.1 : 2.6;

        const breathX = Math.sin(elapsed * 0.6) * 0.08;
        const breathY = Math.cos(elapsed * 0.8) * 0.04;

        cameraRef.current.position.x = THREE.MathUtils.damp(cameraRef.current.position.x, breathX, 4.0, delta);
        cameraRef.current.position.y = THREE.MathUtils.damp(cameraRef.current.position.y, targetCamY + breathY, 4.0, delta);
        cameraRef.current.position.z = THREE.MathUtils.damp(cameraRef.current.position.z, targetCamZ, 4.0, delta);

        _tmpVec3.set(0, 1.15, 0);
        cameraRef.current.lookAt(_tmpVec3);
      }

      renderer.render(scene, camera);
    };

    render();

    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const newW = container.clientWidth || window.innerWidth;
      const newH = container.clientHeight || window.innerHeight;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      renderer.dispose();
      counterTexture.dispose();
      wallTexture.dispose();
      shadowTex.dispose();
      pTex.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [quality]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0"
    />
  );
};
