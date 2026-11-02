import { Color, MeshLambertMaterial, Vector3 } from 'three'
import {
  CEL_BAND_AA_PX,
  CEL_GRAIN_CELL_CSS_PX,
  CEL_GRAIN_DOT_RADIUS,
  CEL_GRAIN_STRENGTH,
  CEL_HATCH_ANGLE_DEG,
  CEL_HATCH_MULTIPLIER,
  CEL_HATCH_PERIOD_CSS_PX,
  CEL_HATCH_WIDTH,
  CEL_LIGHT_DIRECTION,
  CEL_LIGHT_SPOT_COLOR,
  CEL_LIT_MULTIPLIER,
  CEL_SHADOW1_MULTIPLIER,
  CEL_SHADOW2_MULTIPLIER,
  CEL_THRESHOLD_LIGHT_SPOT,
  CEL_THRESHOLD_LIT,
  CEL_THRESHOLD_SHADOW1,
} from './celConstants.js'

// Shared uniform objects, filled once from celConstants.js. Never written per
// frame, so every toon material (and program) shares the same values.
const CEL_UNIFORMS = {
  uCelLightDir: { value: new Vector3(...CEL_LIGHT_DIRECTION).normalize() },
  // Built from an sRGB hex: three converts it to linear, and the stock
  // colorspace_fragment encodes it back to exactly the same hex.
  uCelSpotColor: { value: new Color(CEL_LIGHT_SPOT_COLOR) },
  uCelLit: { value: CEL_LIT_MULTIPLIER },
  uCelShadow1: { value: CEL_SHADOW1_MULTIPLIER },
  uCelShadow2: { value: CEL_SHADOW2_MULTIPLIER },
  uCelTSpot: { value: CEL_THRESHOLD_LIGHT_SPOT },
  uCelTLit: { value: CEL_THRESHOLD_LIT },
  uCelTShadow1: { value: CEL_THRESHOLD_SHADOW1 },
  uCelAA: { value: CEL_BAND_AA_PX },
  uCelHatchAngle: { value: (CEL_HATCH_ANGLE_DEG * Math.PI) / 180 },
  uCelHatchPeriod: { value: CEL_HATCH_PERIOD_CSS_PX },
  uCelHatchWidth: { value: CEL_HATCH_WIDTH },
  uCelHatchMult: { value: CEL_HATCH_MULTIPLIER },
  uCelGrainCell: { value: CEL_GRAIN_CELL_CSS_PX },
  uCelGrainRadius: { value: CEL_GRAIN_DOT_RADIUS },
  uCelGrainStrength: { value: CEL_GRAIN_STRENGTH },
  // Effective DPR; updated by OutlineLayer only when it changes.
  uCelDpr: { value: 1 },
}

export function setCelDpr(dpr) {
  CEL_UNIFORMS.uCelDpr.value = dpr
}

const CEL_HEADER = /* glsl */ `
uniform vec3 uCelLightDir;
uniform vec3 uCelSpotColor;
uniform float uCelLit;
uniform float uCelShadow1;
uniform float uCelShadow2;
uniform float uCelTSpot;
uniform float uCelTLit;
uniform float uCelTShadow1;
uniform float uCelAA;
uniform float uCelHatchAngle;
uniform float uCelHatchPeriod;
uniform float uCelHatchWidth;
uniform float uCelHatchMult;
uniform float uCelGrainCell;
uniform float uCelGrainRadius;
uniform float uCelGrainStrength;
uniform float uCelDpr;

vec2 celHash( vec2 p ) {
  p = vec2( dot( p, vec2( 127.1, 311.7 ) ), dot( p, vec2( 269.5, 183.3 ) ) );
  return fract( sin( p ) * 43758.5453 );
}

// Soft band weight: smoothstep of half-width w (device-px based), hard step when w is 0.
float celBand( float t, float ndl, float w ) {
  return w > 1e-6 ? smoothstep( t - w, t + w, ndl ) : step( t, ndl );
}

vec3 celShade( vec3 base, vec3 N ) {
  float ndl = dot( normalize( N ), uCelLightDir );
  // fwidth outside any branch so derivatives stay well defined.
  float w = 0.5 * uCelAA * fwidth( ndl );
  // Screen-space stripes: s runs across the stripes, in periods.
  float s = dot( gl_FragCoord.xy, vec2( -sin( uCelHatchAngle ), cos( uCelHatchAngle ) ) ) / ( uCelHatchPeriod * uCelDpr );
  float sf = fract( s );
  float sw = fwidth( s );
  float stripe = 1.0 - smoothstep( uCelHatchWidth - sw, uCelHatchWidth + sw, sf );
  vec3 c = base * uCelShadow2 * mix( 1.0, uCelHatchMult, stripe );
  c = mix( c, base * uCelShadow1, celBand( uCelTShadow1, ndl, w ) );
  c = mix( c, base * uCelLit, celBand( uCelTLit, ndl, w ) );
  // Screen-space Voronoi dots, 3x3 neighbourhood.
  vec2 q = gl_FragCoord.xy / ( uCelGrainCell * uCelDpr );
  vec2 qi = floor( q );
  vec2 qf = fract( q );
  float dmin = 8.0;
  for ( int j = -1; j <= 1; j++ ) {
    for ( int i = -1; i <= 1; i++ ) {
      vec2 g = vec2( float( i ), float( j ) );
      dmin = min( dmin, length( g + celHash( qi + g ) - qf ) );
    }
  }
  float dw = fwidth( dmin );
  float dots = 1.0 - smoothstep( uCelGrainRadius - dw, uCelGrainRadius + dw, dmin );
  c = mix( c, uCelSpotColor, celBand( uCelTSpot, ndl, w ) * mix( 1.0, dots, uCelGrainStrength ) );
  return c;
}
`

// Replaces opaque_fragment. Keeps its OPAQUE and transmission alpha handling.
const CEL_OUTPUT = /* glsl */ `
#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( celShade( diffuseColor.rgb, normal ), diffuseColor.a );
`

function onBeforeCompile(shader) {
  Object.assign(shader.uniforms, CEL_UNIFORMS)
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>\n${CEL_HEADER}`)
    .replace('#include <opaque_fragment>', CEL_OUTPUT)
}

export function createToonMaterial(source) {
  const material = new MeshLambertMaterial()
  // The texture is the SAME object as the source's: shared, never cloned or disposed here.
  if (source.map !== undefined) material.map = source.map
  if (source.color) material.color.copy(source.color)
  if (source.normalMap) {
    material.normalMap = source.normalMap
    if (source.normalScale) material.normalScale.copy(source.normalScale)
  }
  if (source.side !== undefined) material.side = source.side
  if (source.vertexColors !== undefined) material.vertexColors = source.vertexColors
  if (source.flatShading !== undefined) material.flatShading = source.flatShading
  material.name = source.name

  material.onBeforeCompile = onBeforeCompile
  material.customProgramCacheKey = () => 'cel-toon-v1'
  return material
}
