document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("artifact-3d-container");
  if (!container) return;

  // 1. Scene, Camera, Renderer setup
  const scene = new THREE.Scene();
  
  const width = container.clientWidth;
  const height = container.clientHeight;
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // 2. Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xb9422e, 2, 50); // Rust-colored glow matching your theme
  pointLight.position.set(2, 3, 4);
  scene.add(pointLight);

  // 3. Load Artifact Image as Texture
  const textureLoader = new THREE.TextureLoader();
  // Using your background-removed image path (ensure you place it in an accessible assets folder or link it directly)
  textureLoader.load('WhatsApp Image 2026-09-11 at 16.29.03 (1) Background Removed.png', (texture) => {
    
    // Create a plane geometry representing the artifact picture
    const geometry = new THREE.PlaneGeometry(3.2, 3.2);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      roughness: 0.4,
      metalness: 0.2,
      side: THREE.DoubleSide
    });

    const artifactMesh = new THREE.Mesh(geometry, material);
    scene.add(artifactMesh);

    // Animation variables for floating motion
    let clock = new THREE.Clock();

    // Interaction state
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotationX = 0;
    let targetRotationY = 0;

    container.addEventListener('mousedown', (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
      container.style.cursor = 'grabbing';
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
      container.style.cursor = 'grab';
    });

    container.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      targetRotationY += deltaX * 0.005;
      targetRotationX += deltaY * 0.005;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    // Slider control sync
    const slider = document.getElementById('artifact-rotate-slider');
    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = (e.target.value / 180) * Math.PI;
        targetRotationY = val;
      });
    }

    // Render Loop with Floating Motion
    function animate() {
      requestAnimationFrame(animate);

      let elapsedTime = clock.getElapsedTime();

      // Subtle floating / hovering motion (above the page a little bit)
      artifactMesh.position.y = Math.sin(elapsedTime * 2) * 0.12; 
      artifactMesh.position.z = Math.cos(elapsedTime * 1.5) * 0.08;

      // Smooth dampening towards target rotations
      artifactMesh.rotation.y += (targetRotationY - artifactMesh.rotation.y) * 0.1;
      artifactMesh.rotation.x += (targetRotationX - artifactMesh.rotation.x) * 0.1;

      // Idle slow sway if not interacting
      if (!isDragging) {
        targetRotationY += 0.003; 
      }

      renderer.render(scene, camera);
    }

    animate();
  });

  // Handle window resizing
  window.addEventListener('resize', () => {
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
  });
});