// Dependency-free equirectangular 360° viewer. Each pixel is sampled from a
// complete 2:1 panorama according to the current virtual camera ray.
const vertex = `attribute vec2 p; varying vec2 uv; void main(){ uv=(p+1.0)*.5; gl_Position=vec4(p,0.0,1.0); }`;
const fragment = `precision highp float;
uniform sampler2D pano;
uniform vec2 resolution;
uniform float yaw;
uniform float pitch;
uniform float halfFov;
varying vec2 uv;
const float PI=3.141592653589793;
void main(){
  vec2 screen=uv*2.0-1.0;
  vec3 ray=normalize(vec3(screen.x*resolution.x/resolution.y*tan(halfFov),screen.y*tan(halfFov),1.0));
  float v=ray.y*cos(pitch)+ray.z*sin(pitch);
  float f=ray.z*cos(pitch)-ray.y*sin(pitch);
  vec3 d=vec3(ray.x*cos(yaw)+f*sin(yaw),f*cos(yaw)-ray.x*sin(yaw),v);
  float longitude=atan(d.x,d.y);
  float latitude=asin(clamp(d.z,-1.0,1.0));
  gl_FragColor=texture2D(pano,vec2(fract(longitude/(2.0*PI)+.5),.5+latitude/PI));
}`;

function shader(gl, source, type) {
  const obj = gl.createShader(type);
  gl.shaderSource(obj, source); gl.compileShader(obj);
  if (!gl.getShaderParameter(obj, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(obj) || 'Shader error');
  return obj;
}

export function createViewer(parent, options) {
  const canvas = document.createElement('canvas');
  canvas.className = 'sphere-canvas';
  canvas.setAttribute('aria-label', '360 градус панорамалық көрініс. Тінтуірмен немесе саусақпен айналдырыңыз.');
  canvas.tabIndex = 0;
  parent.append(canvas);
  let gl;
  try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' }); }
  catch { /* handled below */ }
  if (!gl) { options.onError?.('Бұл құрылғыда WebGL қолжетімсіз. Басқа браузерді ашып көріңіз.'); return { destroy: () => canvas.remove() }; }
  let program, texture;
  try {
    program = gl.createProgram();
    gl.attachShader(program, shader(gl, vertex, gl.VERTEX_SHADER));
    gl.attachShader(program, shader(gl, fragment, gl.FRAGMENT_SHADER));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, 'p'); gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
  } catch { options.onError?.('Панораманы көрсету мүмкін болмады.'); return { destroy: () => canvas.remove() }; }
  let yaw = Number(options.yaw) || 0;
  let pitch = Number(options.pitch) || 0;
  let fov = Math.PI * 76 / 180;
  let active = true, loaded = false;
  const img = new Image(); img.crossOrigin = 'anonymous';
  const observer = new ResizeObserver(draw); observer.observe(parent);
  const norm = a => Math.atan2(Math.sin(a), Math.cos(a));
  function draw() {
    if (!active) return;
    const w = Math.max(1, Math.round(parent.clientWidth * Math.min(devicePixelRatio || 1, 2)));
    const h = Math.max(1, Math.round(parent.clientHeight * Math.min(devicePixelRatio || 1, 2)));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    if (!loaded) return;
    gl.useProgram(program);
    gl.uniform2f(gl.getUniformLocation(program, 'resolution'), w, h);
    gl.uniform1f(gl.getUniformLocation(program, 'yaw'), yaw);
    gl.uniform1f(gl.getUniformLocation(program, 'pitch'), pitch);
    gl.uniform1f(gl.getUniformLocation(program, 'halfFov'), fov / 2);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    options.onChange?.({ yaw, pitch, fov, width: parent.clientWidth, height: parent.clientHeight });
  }
  img.onload = () => {
    if (!active) return;
    if (Math.abs(img.width / img.height - 2) > .015) { options.onError?.('Панорама 2:1 қатынасында болуы керек.'); return; }
    texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    // WebGL 1 requires CLAMP_TO_EDGE for non-power-of-two panorama dimensions.
    // The shader wraps longitude with fract() before sampling the edge.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); }
    catch { options.onError?.('Панораманы жүктеу мүмкін болмады.'); return; }
    loaded = true; draw(); options.onReady?.();
  };
  img.onerror = () => { if (active) options.onError?.('Панорама жүктелмеді. Интернет байланысын немесе файлды тексеріңіз.'); };
  img.src = options.src;

  let pointer = null;
  canvas.addEventListener('pointerdown', e => { pointer = { x: e.clientX, y: e.clientY, yaw, pitch, moved: false }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!pointer) return;
    const dx = e.clientX - pointer.x, dy = e.clientY - pointer.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) pointer.moved = true;
    yaw = norm(pointer.yaw - dx * .004); pitch = Math.max(-1.47, Math.min(1.47, pointer.pitch + dy * .004)); draw();
  });
  canvas.addEventListener('pointerup', e => {
    if (pointer && !pointer.moved) options.onClick?.(pointAt(e.offsetX, e.offsetY));
    pointer = null;
  });
  canvas.addEventListener('wheel', e => { e.preventDefault(); fov = Math.max(.58, Math.min(1.85, fov + e.deltaY * .001)); draw(); }, { passive: false });
  canvas.addEventListener('keydown', e => {
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key)) return;
    e.preventDefault();
    if (e.key === 'ArrowLeft') yaw = norm(yaw - .1);
    if (e.key === 'ArrowRight') yaw = norm(yaw + .1);
    if (e.key === 'ArrowUp') pitch = Math.min(1.47, pitch + .1);
    if (e.key === 'ArrowDown') pitch = Math.max(-1.47, pitch - .1);
    if (e.key === '+') fov = Math.max(.58, fov - .12);
    if (e.key === '-') fov = Math.min(1.85, fov + .12);
    draw();
  });
  function pointAt(x, y) {
    const sx = (x / parent.clientWidth * 2 - 1) * parent.clientWidth / parent.clientHeight * Math.tan(fov / 2);
    const sy = (1 - y / parent.clientHeight * 2) * Math.tan(fov / 2);
    const vertical = sy * Math.cos(pitch) + Math.sin(pitch);
    const forward = Math.cos(pitch) - sy * Math.sin(pitch);
    const worldX = sx * Math.cos(yaw) + forward * Math.sin(yaw);
    const worldY = forward * Math.cos(yaw) - sx * Math.sin(yaw);
    return { yaw: norm(Math.atan2(worldX, worldY)), pitch: Math.max(-1.55, Math.min(1.55, Math.atan2(vertical, Math.hypot(sx, forward)))) };
  }
  return {
    getView: () => ({ yaw, pitch, fov, width: parent.clientWidth, height: parent.clientHeight }),
    rotate: (amount) => { yaw = norm(yaw + amount); draw(); },
    zoom: (amount) => { fov = Math.max(.58, Math.min(1.85, fov + amount)); draw(); },
    destroy: () => { active = false; img.onload = null; img.onerror = null; observer.disconnect(); canvas.remove(); if (texture) gl.deleteTexture(texture); gl.deleteProgram(program); },
  };
}

export function projectMarker(marker, view) {
  const delta = Math.atan2(Math.sin(marker.yaw - view.yaw), Math.cos(marker.yaw - view.yaw));
  const cp = Math.cos(marker.pitch), sp = Math.sin(marker.pitch);
  const forward = cp * Math.cos(delta) * Math.cos(view.pitch) + sp * Math.sin(view.pitch);
  if (forward <= .01) return null;
  const sx = cp * Math.sin(delta) / forward;
  const sy = (sp * Math.cos(view.pitch) - cp * Math.cos(delta) * Math.sin(view.pitch)) / forward;
  const x = .5 + sx / (2 * Math.tan(view.fov / 2) * view.width / view.height);
  const y = .5 - sy / (2 * Math.tan(view.fov / 2));
  return x < -.12 || x > 1.12 || y < -.12 || y > 1.12 ? null : { x: x * view.width, y: y * view.height };
}
