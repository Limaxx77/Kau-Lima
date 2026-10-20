/* =========================================================
   HERO 3D — esfera de partículas com ruído orgânico,
   wireframe orbital e poeira estelar. Reage ao mouse,
   ao clique (onda de choque) e ao scroll.
   Pausa fora da tela; respeita movimento reduzido.
   ========================================================= */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";

const canvas = document.getElementById("heroCanvas");
const hero = document.querySelector(".hero");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return Boolean(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
}

const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

function init() {
  const isSmall = innerWidth < 820;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 7;

  const root = new THREE.Group();
  scene.add(root);

  /* --- Esfera de partículas (distribuição de Fibonacci) --- */
  const COUNT = isSmall ? 2600 : 6500;
  const positions = new Float32Array(COUNT * 3);
  const randoms = new Float32Array(COUNT);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < COUNT; i++) {
    const y = 1 - (i / (COUNT - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    positions.set([Math.cos(theta) * r, y, Math.sin(theta) * r], i * 3);
    randoms[i] = Math.random();
  }
  const sphereGeo = new THREE.BufferGeometry();
  sphereGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  sphereGeo.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));

  const uniforms = {
    uTime: { value: 0 },
    uPixel: { value: renderer.getPixelRatio() },
    uMouse: { value: new THREE.Vector3(10, 10, 0) },
    uPulse: { value: 0 },
    uRadius: { value: 1.75 },
  };

  const sphereMat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      ${NOISE}
      uniform float uTime; uniform float uPixel; uniform vec3 uMouse; uniform float uPulse; uniform float uRadius;
      attribute float aRandom;
      varying float vAlpha;
      void main() {
        vec3 dir = normalize(position);
        float n = snoise(dir * 1.6 + vec3(uTime * 0.12));
        float n2 = snoise(dir * 4.0 - vec3(uTime * 0.2)) * 0.25;
        float disp = (n + n2) * 0.28;
        // onda de choque do clique
        float wave = sin(dir.y * 10.0 - uPulse * 14.0) * uPulse * 0.25;
        vec3 pos = dir * (uRadius + disp + wave);
        vec4 world = modelMatrix * vec4(pos, 1.0);
        // repulsão suave perto do mouse
        vec3 toMouse = world.xyz - uMouse;
        float d = length(toMouse.xy);
        world.xyz += normalize(toMouse + 0.0001) * smoothstep(1.4, 0.0, d) * 0.45;
        vec4 mv = viewMatrix * world;
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (1.4 + aRandom * 2.2) * uPixel * (6.0 / -mv.z);
        vAlpha = 0.25 + smoothstep(-0.3, 0.4, disp) * 0.6 + smoothstep(1.2, 0.0, d) * 0.5;
        vAlpha *= smoothstep(-9.5, -5.5, mv.z);
      }`,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vec3(1.0), a * vAlpha * 0.85);
      }`,
  });
  const sphere = new THREE.Points(sphereGeo, sphereMat);
  root.add(sphere);

  /* --- Wireframe orbital --- */
  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(2.6, 1)),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07 })
  );
  root.add(wire);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.95, 0.004, 8, 180),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 })
  );
  ring.rotation.x = Math.PI / 2.3;
  root.add(ring);

  /* --- Poeira de fundo --- */
  const DUST = isSmall ? 260 : 700;
  const dustPos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    dustPos.set([(Math.random() - 0.5) * 22, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 10 - 2], i * 3);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: 0xffffff, size: 0.018, transparent: true, opacity: 0.45, depthWrite: false, sizeAttenuation: true,
  }));
  scene.add(dust);

  /* --- Layout responsivo --- */
  const layout = () => {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const small = w < 820;
    root.position.set(small ? 0.6 : 2.4, small ? 1.4 : 0, 0);
    root.scale.setScalar(small ? 0.78 : 1);
  };
  layout();
  addEventListener("resize", layout);

  /* --- Interação --- */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const raycastPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hit = new THREE.Vector3();

  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    pointer.tx = ndc.x;
    pointer.ty = ndc.y;
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(raycastPlane, hit)) uniforms.uMouse.value.copy(hit);
  });
  hero.addEventListener("pointerleave", () => { pointer.tx = 0; pointer.ty = 0; uniforms.uMouse.value.set(10, 10, 0); });
  hero.addEventListener("pointerdown", (e) => {
    if (e.target.closest("a, button")) return;
    uniforms.uPulse.value = 1;
  });

  /* --- Loop --- */
  const clock = new THREE.Clock();
  let running = false;
  let introScale = reduceMotion ? 1 : 0.001;

  const render = () => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    uniforms.uTime.value = t;
    uniforms.uPulse.value = Math.max(0, uniforms.uPulse.value - dt * 0.9);

    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;

    const scroll = Math.min(scrollY / innerHeight, 1);
    introScale += (1 - introScale) * 0.035;

    root.rotation.y = t * 0.08 + pointer.x * 0.5;
    root.rotation.x = -pointer.y * 0.35 + scroll * 0.6;
    wire.rotation.y = -t * 0.05;
    wire.rotation.z = t * 0.03;
    ring.rotation.z = t * 0.1;
    root.scale.setScalar((innerWidth < 820 ? 0.78 : 1) * introScale * (1 + scroll * 0.35));
    dust.rotation.y = t * 0.01 + pointer.x * 0.08;
    dust.position.y = scroll * 1.5;
    camera.position.x = pointer.x * 0.25;
    camera.position.y = pointer.y * 0.2;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    if (running) requestAnimationFrame(render);
  };

  const start = () => { if (!running && !reduceMotion) { running = true; clock.getDelta(); requestAnimationFrame(render); } };
  const stop = () => { running = false; };

  if (reduceMotion) {
    render();
    addEventListener("resize", () => render());
    return;
  }

  let visible = true;
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visible && !document.hidden ? start() : stop();
  }).observe(hero);
  document.addEventListener("visibilitychange", () => (document.hidden || !visible ? stop() : start()));

  // Começa junto com a intro do hero (ou imediatamente se ela já aconteceu)
  if (hero.classList.contains("is-ready")) start();
  else document.addEventListener("hero:ready", start, { once: true });
  setTimeout(() => { if (visible && !document.hidden) start(); }, 2500);
}

if (canvas && hero && supportsWebGL()) {
  try {
    init();
  } catch (err) {
    console.warn("Hero 3D desativado:", err);
  }
}
