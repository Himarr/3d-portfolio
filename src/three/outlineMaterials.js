import { Color, DoubleSide, NormalBlending, ShaderMaterial, Vector2, Vector3 } from 'three'
import {
  CEL_LIGHT_DIRECTION,
  OUTLINE_COLOR,
  OUTLINE_DEPTH_THRESHOLD,
  OUTLINE_INNER_GRAZING_Z,
  OUTLINE_INNER_SHADOW_ONLY,
  OUTLINE_INNER_SHADOW_THRESHOLD,
  OUTLINE_INNER_SILHOUETTE_MARGIN,
  OUTLINE_NORMAL_THRESHOLD,
  OUTLINE_RING_STEPS,
  OUTLINE_RING_TAPS,
} from './celConstants.js'

// Mask pass: view-space normal xy, depth relative to the anchor (units of radius)
// and coverage (alpha 1). Rendered via scene.overrideMaterial into a float target,
// so no colour-space conversion is applied (the data must stay raw).
const MASK_VERTEX = /* glsl */ `
varying vec3 vViewNormal;
varying float vViewZ;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  vViewNormal = normalize( normalMatrix * normal );
  vViewZ = mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}
`

const MASK_FRAGMENT = /* glsl */ `
uniform float uDepthRef;
uniform float uRadius;
varying vec3 vViewNormal;
varying float vViewZ;

void main() {
  vec3 n = normalize( vViewNormal );
  // Back faces: flip so the stored normal faces the viewer.
  if ( ! gl_FrontFacing ) n = - n;
  gl_FragColor = vec4( n.xy, ( - vViewZ - uDepthRef ) / uRadius, 1.0 );
}
`

// Silhouette ring: a quad covering the mask region. Covered centre texel -> alpha 1
// (hidden under the model by the depth test); otherwise any covered tap on circular
// rings within the thickness radius gives a solid pixel (binary alpha 1, no fade);
// everything else is discarded.
const RING_VERTEX = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`

function ringFragment(steps, taps) {
  return /* glsl */ `
uniform sampler2D uMask;
uniform vec2 uTexelSize;
uniform float uThicknessDev;
uniform vec3 uColor;
varying vec2 vUv;

#define RING_STEPS ${steps}
#define RING_TAPS ${taps}

void main() {
  if ( texture2D( uMask, vUv ).a <= 0.5 ) {
    float dMin = 1e5;
    for ( int s = 1; s <= RING_STEPS; s ++ ) {
      float d = uThicknessDev * float( s ) / float( RING_STEPS );
      // Rotate each ring a little so taps of neighbouring rings do not line up.
      float phase = 0.5 * float( s );
      for ( int k = 0; k < RING_TAPS; k ++ ) {
        float a = 6.28318530718 * float( k ) / float( RING_TAPS ) + phase;
        vec2 offset = vec2( cos( a ), sin( a ) ) * d * uTexelSize;
        if ( texture2D( uMask, vUv + offset ).a > 0.5 ) {
          dMin = min( dMin, d );
        }
      }
      if ( dMin < 1e4 ) break;
    }
    if ( dMin > uThicknessDev ) discard;
  }
  gl_FragColor = vec4( uColor, 1.0 );
  #include <colorspace_fragment>
}
`
}

// Inner edges (crater rims, creases): Roberts-cross differences of the mask on the
// four diagonal taps at offset d = thickness / 2 texels, so the line is about one
// thickness wide. dN is the normal-xy difference, dZ the relative-depth difference.
// Thresholds are baked in as #defines (they are static constants, no uniform needed).
// Hard test: a stroke is solid colour at alpha 1 when either response reaches its
// threshold, otherwise the fragment is discarded (binary alpha, no ramp).
// Any uncovered tap gives no stroke: the silhouette belongs to the ring material.
// Eight extra coverage taps at margin * thickness texels (every 45 degrees) also
// suppress strokes near the silhouette, so no second line forms inside the limb.
// Shadow-side gate (optional): N.L at the centre texel from the mask normal (xy stored,
// z reconstructed facing the viewer) against the view-space light; strokes are kept only
// if N.L <= threshold. Like the toon shader this uses geometry normals only.
// Grazing-angle gate (D-19): no stroke where the reconstructed view-normal z at the
// centre texel is below grazingZ (surface nearly edge-on, near the limb).
function innerEdgeFragment(normalThreshold, depthThreshold, margin, grazingZ, shadowGate) {
  const gateDefs = shadowGate
    ? `
#define SHADOW_THRESHOLD ${shadowGate.threshold.toFixed(6)}
const vec3 LIGHT_DIR = vec3( ${shadowGate.light.map((v) => v.toFixed(6)).join(', ')} );
`
    : ''
  const gateCode = shadowGate
    ? `
  float ndl = dot( vec3( cxy, cz ), normalize( LIGHT_DIR ) );
  if ( ndl > SHADOW_THRESHOLD ) discard;
`
    : ''
  return /* glsl */ `
uniform sampler2D uMask;
uniform vec2 uTexelSize;
uniform float uThicknessDev;
uniform vec3 uColor;
varying vec2 vUv;

#define NORMAL_THRESHOLD ${normalThreshold.toFixed(6)}
#define DEPTH_THRESHOLD ${depthThreshold.toFixed(6)}
#define SILHOUETTE_MARGIN ${margin.toFixed(6)}
#define GRAZING_Z ${grazingZ.toFixed(6)}
${gateDefs}
void main() {
  vec2 o = 0.5 * uThicknessDev * uTexelSize;
  vec4 a = texture2D( uMask, vUv + vec2( o.x, o.y ) );
  vec4 b = texture2D( uMask, vUv - vec2( o.x, o.y ) );
  vec4 c = texture2D( uMask, vUv + vec2( o.x, - o.y ) );
  vec4 e = texture2D( uMask, vUv + vec2( - o.x, o.y ) );
  if ( a.a < 0.5 || b.a < 0.5 || c.a < 0.5 || e.a < 0.5 ) discard;
  float m = SILHOUETTE_MARGIN * uThicknessDev;
  vec2 mo = m * uTexelSize;
  const float K = 0.70710678;
  if ( texture2D( uMask, vUv + vec2( mo.x, 0.0 ) ).a < 0.5 ||
       texture2D( uMask, vUv - vec2( mo.x, 0.0 ) ).a < 0.5 ||
       texture2D( uMask, vUv + vec2( 0.0, mo.y ) ).a < 0.5 ||
       texture2D( uMask, vUv - vec2( 0.0, mo.y ) ).a < 0.5 ||
       texture2D( uMask, vUv + K * mo ).a < 0.5 ||
       texture2D( uMask, vUv - K * mo ).a < 0.5 ||
       texture2D( uMask, vUv + K * vec2( mo.x, - mo.y ) ).a < 0.5 ||
       texture2D( uMask, vUv + K * vec2( - mo.x, mo.y ) ).a < 0.5 ) discard;
  vec4 d1 = a - b;
  vec4 d2 = c - e;
  float dN = sqrt( dot( d1.xy, d1.xy ) + dot( d2.xy, d2.xy ) );
  float dZ = sqrt( d1.z * d1.z + d2.z * d2.z );
  if ( dN < NORMAL_THRESHOLD && dZ < DEPTH_THRESHOLD ) discard;
  vec2 cxy = texture2D( uMask, vUv ).xy;
  float cz = sqrt( max( 0.0, 1.0 - dot( cxy, cxy ) ) );
  if ( cz < GRAZING_Z ) discard;
${gateCode}  gl_FragColor = vec4( uColor, 1.0 );
  #include <colorspace_fragment>
}
`
}

export function createMaskMaterial() {
  return new ShaderMaterial({
    uniforms: {
      uDepthRef: { value: 0 },
      uRadius: { value: 1 },
    },
    vertexShader: MASK_VERTEX,
    fragmentShader: MASK_FRAGMENT,
    side: DoubleSide,
    depthTest: true,
    depthWrite: true,
  })
}

export function createRingMaterial() {
  return new ShaderMaterial({
    uniforms: {
      uMask: { value: null },
      uTexelSize: { value: new Vector2(1, 1) },
      uThicknessDev: { value: 1 },
      // Built from an sRGB hex: three converts to linear, colorspace_fragment encodes back.
      uColor: { value: new Color(OUTLINE_COLOR) },
    },
    vertexShader: RING_VERTEX,
    fragmentShader: ringFragment(OUTLINE_RING_STEPS, OUTLINE_RING_TAPS),
    transparent: true,
    blending: NormalBlending,
    depthTest: true,
    depthWrite: false,
  })
}

export function createInnerEdgeMaterial() {
  return new ShaderMaterial({
    uniforms: {
      uMask: { value: null },
      uTexelSize: { value: new Vector2(1, 1) },
      uThicknessDev: { value: 1 },
      uColor: { value: new Color(OUTLINE_COLOR) },
    },
    vertexShader: RING_VERTEX,
    fragmentShader: innerEdgeFragment(
      OUTLINE_NORMAL_THRESHOLD,
      OUTLINE_DEPTH_THRESHOLD,
      OUTLINE_INNER_SILHOUETTE_MARGIN,
      OUTLINE_INNER_GRAZING_Z,
      OUTLINE_INNER_SHADOW_ONLY
        ? {
            threshold: OUTLINE_INNER_SHADOW_THRESHOLD,
            light: new Vector3(...CEL_LIGHT_DIRECTION).normalize().toArray(),
          }
        : null,
    ),
    transparent: true,
    blending: NormalBlending,
    depthTest: false,
    depthWrite: false,
  })
}
