import{Scene as U,OrthographicCamera as O,TextureLoader as A,LinearFilter as R,SRGBColorSpace as y,WebGLRenderer as V,ShaderMaterial as D,Color as P,Vector2 as C,PlaneGeometry as F,Mesh as _}from"./three.module.jK16zlKs.js";import{g as L}from"./index.B8hmduGV.js";import{S}from"./ScrollTrigger.DQG0xCVk.js";import{p as q,i as b}from"./utils.BS9nFPiA.js";import{g as H}from"./cssVars.CEDR8Mtq.js";L.registerPlugin(S.ScrollTrigger);const k=`
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,G=`
  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform vec2 uImageResolution;
  uniform float uProgress;
  uniform vec3 uFillColor;

  varying vec2 vUv;

  vec2 coverUV(vec2 uv, vec2 screenSize, vec2 imageSize) {
    float screenRatio = screenSize.x / screenSize.y;
    float imageRatio = imageSize.x / imageSize.y;
    vec2 newUV = uv;

    if (screenRatio > imageRatio) {
      float scale = screenRatio / imageRatio;
      newUV.y = (uv.y - 0.5) / scale + 0.5;
    } else {
      float scale = imageRatio / screenRatio;
      newUV.x = (uv.x - 0.5) / scale + 0.5;
    }

    return newUV;
  }

  float quadraticInOut(float t) {
    float p = 2.0 * t * t;
    return t < 0.5 ? p : -p + (4.0 * t) - 1.0;
  }

  void main() {
    vec2 uv = coverUV(vUv, uResolution, uImageResolution);
    float imageAspect = uImageResolution.x / uImageResolution.y;
    float progress = quadraticInOut(1.0 - uProgress);
    float s = 50.0;
    vec2 gridSize = vec2(
      s,
      floor(s / imageAspect)
    );

    float v = smoothstep(
      0.0,
      1.0,
      vUv.y + sin(vUv.x * 4.0 + progress * 6.0) * mix(0.3, 0.1, abs(0.5 - vUv.x)) * 0.5 * smoothstep(0.0, 0.2, progress) + (1.0 - progress * 2.0)
    );

    float mixnewUV = (vUv.x * 3.0 + (1.0 - v) * 50.0) * progress;
    vec2 pixelUV = floor(uv * gridSize) / gridSize + 0.5 / gridSize;
    vec2 subUv = mix(uv, pixelUV, mixnewUV);

    vec4 color = texture2D(uTexture, subUv);
    color.a = pow(v, 1.0);
    color.rgb = mix(color.rgb, uFillColor, smoothstep(0.5, 0.0, abs(0.5 - color.a)) * progress);

    gl_FragColor = color;
    gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(1.0 / 2.2));
  }
`;class T{constructor(e){this.container=e,this.image=e.querySelector(".lab-card-image"),this.canvas=e.querySelector(".lab-card-reveal-canvas"),this.fillColor=H("--color-secondary","#0b0b0b"),this.renderer=null,this.material=null,this.mesh=null,this.texture=null,this.scrollTrigger=null,this.resizeObserver=null,this.isContextLost=!1,this.isDestroyed=!1,this.initToken=0,this.scene=new U,this.camera=new O(-1,1,1,-1,.1,10),this.camera.position.z=1,this.handleResize=()=>{this.resize(),n(this)},this.onContextLost=t=>{t.preventDefault(),this.isContextLost=!0,this.destroy()},this.onContextRestored=()=>{this.isContextLost&&(this.isContextLost=!1,w.has(this.container)&&(this.isDestroyed=!1,this.init()))},this.init()}async init(){if(this.isDestroyed||!(this.image instanceof HTMLImageElement)||!(this.canvas instanceof HTMLCanvasElement))return;const e=this.image.currentSrc||this.image.src;if(!e)return;const t=++this.initToken;try{if(await this.loadTexture(e),this.isDestroyed||t!==this.initToken||!M())return;if(!this.createRenderer()){this.destroy();return}if(this.isDestroyed||t!==this.initToken)return;this.canvas.addEventListener("webglcontextlost",this.onContextLost,{passive:!1}),this.canvas.addEventListener("webglcontextrestored",this.onContextRestored),this.createMesh(),this.resize(),this.observeResize(),this.createScrollTrigger(),this.container.classList.add("lab-card-media--ready"),n(this)}catch{}}loadTexture(e){return new Promise((t,i)=>{new A().load(e,c=>{c.minFilter=R,c.magFilter=R,c.colorSpace=y,this.texture=c,t()},void 0,c=>i(c))})}createRenderer(){if(!this.canvas)return!1;const e={alpha:!0,antialias:!1,premultipliedAlpha:!1,powerPreference:"low-power"},t=this.canvas.getContext("webgl2",e);if(!t||typeof t.isContextLost=="function"&&t.isContextLost())return!1;try{this.renderer=new V({canvas:this.canvas,context:t,antialias:!1,alpha:!0,premultipliedAlpha:!1,powerPreference:"low-power"})}catch{return!1}return this.renderer.setClearColor(0,0),this.renderer.outputColorSpace=y,!0}createMesh(){if(!this.texture)return;const e=this.texture.image,t=e&&e.width?e.width:1,i=e&&e.height?e.height:1;this.material=new D({uniforms:{uTexture:{value:this.texture},uResolution:{value:new C(1,1)},uImageResolution:{value:new C(t,i)},uProgress:{value:0},uFillColor:{value:new P(this.fillColor)}},vertexShader:k,fragmentShader:G,transparent:!0});const l=new F(2,2);this.mesh=new _(l,this.material),this.scene.add(this.mesh)}resize(){if(!this.renderer||!this.material)return;const e=this.container.getBoundingClientRect();if(e.width<=0||e.height<=0)return;const t=Math.min(window.devicePixelRatio||1,1.5);this.renderer.setPixelRatio(t),this.renderer.setSize(e.width,e.height,!1),this.material.uniforms.uResolution.value.set(e.width,e.height)}observeResize(){"ResizeObserver"in window?(this.resizeObserver=new ResizeObserver(()=>{this.resize(),n(this)}),this.resizeObserver.observe(this.container)):window.addEventListener("resize",this.handleResize)}createScrollTrigger(){if(!this.material)return;const e=window.matchMedia("(max-width: 768px)").matches;this.scrollTrigger=S.ScrollTrigger.create({trigger:this.container,start:e?"top 100%":"top 160%",end:e?"bottom 40%":"bottom 60%",scrub:.6,onUpdate:t=>{!this.material||this.isDestroyed||(this.material.uniforms.uProgress.value=t.progress,n(this))},onRefresh:()=>{this.resize(),n(this)}})}render(){!this.renderer||this.isDestroyed||this.renderer.render(this.scene,this.camera)}activate(){this.isDestroyed||(this.scrollTrigger?(this.scrollTrigger.enable(),this.scrollTrigger.refresh()):this.createScrollTrigger(),n(this))}deactivate(){this.scrollTrigger&&this.scrollTrigger.disable()}destroy(){this.isDestroyed||(this.isDestroyed=!0,this.initToken+=1,a.delete(this),this.scrollTrigger&&(this.scrollTrigger.kill(),this.scrollTrigger=null),this.resizeObserver?(this.resizeObserver.disconnect(),this.resizeObserver=null):window.removeEventListener("resize",this.handleResize),this.container.classList.remove("lab-card-media--ready"),this.canvas&&(this.canvas.removeEventListener("webglcontextlost",this.onContextLost),this.canvas.removeEventListener("webglcontextrestored",this.onContextRestored)),this.mesh&&this.mesh.geometry.dispose(),this.material&&this.material.dispose(),this.texture&&this.texture.dispose(),this.renderer&&this.renderer.dispose(),this.mesh=null,this.material=null,this.texture=null,this.renderer=null)}}const N=4,W=1,s=new Map,o=[],w=new Set,a=new Set;let u=null,h=null,g=null,d=null,v=null,f=null,m=null;function n(r){!r||!r.renderer||(a.add(r),!u&&(u=requestAnimationFrame(()=>{u=null,a.forEach(e=>e.render()),a.clear()})))}function z(r){const e=o.indexOf(r);e!==-1&&o.splice(e,1)}function B(r){z(r),o.push(r)}function E(){return b()?W:N}function X(r){if(s.has(r)||o.length<E())return;const e=o.find(i=>!w.has(i))||o[0];if(!e)return;const t=s.get(e);t&&(a.delete(t),t.destroy(),s.delete(e)),z(e)}function M(){if(g!==null)return g;try{g=!!document.createElement("canvas").getContext("webgl2")}catch{g=!1}return g}function j(){return"IntersectionObserver"in window?(h||(h=new IntersectionObserver(r=>{r.forEach(e=>{const t=e.target;if(!(t instanceof HTMLElement))return;if(e.isIntersecting){w.add(t);const l=s.get(t);if(!l||!l.renderer){if(X(t),o.length>=E())return;s.set(t,new T(t))}else l.activate();B(t);return}w.delete(t);const i=s.get(t);i&&(a.delete(i),i.deactivate())})},{rootMargin:b()?"80px 0px":"200px 0px",threshold:.01})),h):null}function K(r){const e=j();if(!e){s.has(r)||s.set(r,new T(r));return}e.observe(r)}function p(){if(I(),q()||!M()||b())return;document.querySelectorAll("[data-lab-reveal]").forEach(e=>{e instanceof HTMLElement&&K(e)})}function Q(r,e={}){if(!(r instanceof HTMLElement))return{ran:!1,duration:0};const t=s.get(r);if(!t||!t.material)return{ran:!1,duration:0};const i=typeof e.duration=="number"?e.duration:.2;return t.scrollTrigger&&t.scrollTrigger.disable(),L.to(t.material.uniforms.uProgress,{value:1,duration:i,ease:"power2.out",overwrite:!0,onUpdate:()=>n(t),onComplete:()=>{n(t),typeof e.onComplete=="function"&&e.onComplete()}}),{ran:!0,duration:i}}function I(){s.forEach(r=>r.destroy()),s.clear(),o.length=0,w.clear(),a.clear(),u&&(cancelAnimationFrame(u),u=null),h&&(h.disconnect(),h=null)}function x(){d||(d=window.matchMedia("(max-width: 768px)"),v=()=>{p()},d.addEventListener("change",v)),f||(f=window.matchMedia("(prefers-reduced-motion: reduce)"),m=()=>{p()},f.addEventListener("change",m))}function J(){d&&v&&d.removeEventListener("change",v),d=null,v=null,f&&m&&f.removeEventListener("change",m),f=null,m=null}typeof window<"u"&&(document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{p(),x()}):(p(),x()),document.addEventListener("astro:page-load",()=>{document.querySelector("[data-lab-reveal]")&&p(),x()}),document.addEventListener("astro:before-swap",()=>{I(),J()}),window.__labImageReveal={forceReveal:Q});
