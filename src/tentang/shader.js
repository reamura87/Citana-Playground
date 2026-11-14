// Shader bergaya lukisan wayang Kamasan: warna datar bertahap (sungging), garis tepi hitam, urat halus.

export const PALET = {
  //        terang        gelap
  merah:  ['#cf4a2c', '#6e1510'],
  kuning: ['#f3c64f', '#a8701a'],
  biru:   ['#4a74b8', '#162b52'],
  hijau:  ['#62a357', '#234a29'],
  krem:   ['#fcf1d0', '#d2ad6c'],
  hitam:  ['#3a2c26', '#120d0a'],
  emas:   ['#fbd65c', '#b8861c'],
  coklat: ['#b05f31', '#4a2210'],
}
export const URUTAN_PALET = ['merah', 'kuning', 'biru', 'hijau', 'krem', 'hitam', 'emas', 'coklat']

export const VERT_DAUN = /* glsl */ `
  attribute vec4 aInfo;
  uniform float uWaktu;
  uniform vec2 uAngin;
  varying vec2 vUv;
  varying vec4 vInfo;
  varying vec3 vN;
  void main() {
    vUv = uv;
    vInfo = aInfo;
    vec3 p = position;
    float kuat = aInfo.w * smoothstep(0.0, 1.0, uv.x);
    float s = sin(uWaktu * 1.2 + aInfo.z * 6.2831 + p.y * 0.45) + 0.5 * sin(uWaktu * 2.1 + aInfo.z * 11.0 + p.x * 0.6);
    p.x += s * 0.05 * kuat + uAngin.x * 0.25 * kuat;
    p.y += cos(uWaktu * 1.05 + aInfo.z * 5.0) * 0.028 * kuat + uAngin.y * 0.15 * kuat;
    p.z += sin(uWaktu * 0.9 + aInfo.z * 9.0) * 0.05 * kuat;
    vN = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

export const FRAG_DAUN = /* glsl */ `
  precision highp float;
  uniform vec3 uTerang[8];
  uniform vec3 uGelap[8];
  uniform vec3 uKabut;
  uniform float uKabutKuat;
  uniform float uRedup;
  varying vec2 vUv;
  varying vec4 vInfo;
  varying vec3 vN;

  const vec3 HITAM = vec3(0.075, 0.05, 0.04);
  const vec3 EMAS = vec3(0.98, 0.78, 0.25);

  void main() {
    float jenis = vInfo.x;
    int pal = int(vInfo.y + 0.5);
    vec3 terang = uTerang[pal];
    vec3 gelap = uGelap[pal];
    float u = vUv.x;
    float v = vUv.y;
    vec3 n = gl_FrontFacing ? vN : -vN;
    vec3 col;

    if (jenis > 1.5) {
      // cakram bercincin: pusat emas, cincin merah, tepi krem, garis hitam
      float r = u;
      float fr = fwidth(r) + 1e-4;
      col = r < 0.38 ? uTerang[6] : (r < 0.7 ? uTerang[0] : uTerang[4]);
      float c1 = 1.0 - smoothstep(0.0, fr * 2.0, abs(r - 0.38));
      float c2 = 1.0 - smoothstep(0.0, fr * 2.0, abs(r - 0.7));
      float c3 = smoothstep(1.0 - fr * 2.6, 1.0, r);
      col = mix(col, HITAM, max(max(c1, c2) * 0.85, c3));
    } else if (jenis > 0.5) {
      // sulur: coklat kemerahan dengan garis emas di tengah dan tepi hitam
      float edge = 1.0 - abs(v);
      float fw = fwidth(v) + 1e-4;
      col = mix(gelap, terang, smoothstep(0.0, 0.8, edge));
      float tengah = 1.0 - smoothstep(0.0, fw * 1.6 + 0.08, abs(v));
      col = mix(col, EMAS * 0.9, tengah * 0.8);
      float garis = 1.0 - smoothstep(0.0, fw * 2.4, edge);
      col = mix(col, HITAM, garis);
    } else {
      float edge = 1.0 - abs(v);
      float fw = fwidth(v) + 1e-4;
      // sungging: tepi gelap menuju tengah terang, bertahap seperti lukisan wayang
      float t = smoothstep(0.0, 0.9, edge);
      float tangga = floor(t * 4.0) / 4.0;
      col = mix(gelap, terang, tangga * 0.62 + t * 0.38);
      // goresan halus sejajar pada sisi gelap
      float gores = abs(fract(u * 28.0 + abs(v) * 5.0) - 0.5);
      col = mix(col, gelap, (1.0 - smoothstep(0.0, 0.14, gores)) * 0.4 * (1.0 - t));
      // urat daun diagonal
      float lp = u * 8.0 - abs(v) * 1.5;
      float g = fract(lp);
      float d = min(g, 1.0 - g);
      float urat = 1.0 - smoothstep(0.0, fwidth(lp) * 1.4 + 0.015, d);
      urat *= smoothstep(0.12, 0.3, edge) * smoothstep(0.06, 0.12, u);
      col = mix(col, gelap * 0.8, urat * 0.55);
      // tulang daun di tengah
      float tulang = 1.0 - smoothstep(0.0, fw * 1.4 + 0.025, abs(v));
      col = mix(col, gelap * 0.75, tulang * 0.8 * smoothstep(0.02, 0.1, u));
      // garis tepi hitam
      float garis = 1.0 - smoothstep(0.0, fw * 2.4 + 0.03, edge);
      col = mix(col, HITAM, garis);
    }

    // pencahayaan bertahap (cel) dari kiri atas, memberi kesan tiga dimensi tanpa menghilangkan kesan datar
    float L = clamp(dot(normalize(n), normalize(vec3(-0.45, 0.65, 0.6))), 0.0, 1.0);
    float tahap = floor(L * 3.0) / 3.0;
    col *= 0.8 + 0.28 * tahap;
    col = mix(col, uKabut, uKabutKuat);
    col *= uRedup;
    gl_FragColor = vec4(col, 1.0);
  }
`

export const VERT_BIDANG = /* glsl */ `
  uniform vec2 uUkuran;
  varying vec2 vP;
  void main() {
    vP = (uv * 2.0 - 1.0) * uUkuran;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Bingkai berbentuk gunungan/kori dengan foto di dalamnya dan pita hias berlapis
export const FRAG_BINGKAI = /* glsl */ `
  precision highp float;
  uniform sampler2D uFoto;
  uniform float uAspekFoto;
  uniform float uBayangan;
  uniform float uWaktu;
  varying vec2 vP;

  const vec3 HITAM = vec3(0.075, 0.05, 0.04);
  const vec3 EMAS = vec3(0.96, 0.74, 0.2);
  const vec3 MERAH = vec3(0.62, 0.13, 0.09);

  // jarak bertanda perkiraan: positif di dalam bentuk
  float bentuk(vec2 p) {
    float ax = abs(p.x);
    float puncak = 0.84 + 0.42 * pow(max(0.0, 1.0 - ax), 1.35) + 0.028 * sin(ax * 24.0) * (1.0 - ax);
    float dAtas = (puncak - p.y) * 0.72;
    float dSisi = 1.0 - ax;
    float dBawah = p.y + 1.26;
    float sudut = min(dSisi, dBawah);
    return min(sudut, dAtas);
  }

  void main() {
    float s = bentuk(vP);
    float fw = fwidth(s) + 1e-4;
    if (uBayangan > 0.5) {
      float sb = bentuk(vP - vec2(0.05, -0.07));
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.42 * smoothstep(-0.07, 0.13, sb));
      return;
    }
    float alfa = smoothstep(0.0, fw * 1.5, s);
    if (alfa <= 0.0) discard;

    vec3 col;
    float ang = atan(vP.y * 0.8, vP.x);
    if (s < 0.034) {
      col = HITAM;
    } else if (s < 0.085) {
      col = EMAS;
    } else if (s < 0.165) {
      col = MERAH;
      // butiran emas di sepanjang pita merah
      float k = fract(ang * 22.0 / 3.14159265);
      float dm = length(vec2((k - 0.5) * 0.06, s - 0.125));
      col = mix(col, EMAS, 1.0 - smoothstep(0.016, 0.02, dm));
    } else if (s < 0.188) {
      col = EMAS;
    } else if (s < 0.218) {
      col = HITAM;
    } else {
      vec2 q = vec2(vP.x, vP.y / 1.26) * 0.5 + 0.5;
      float ka = 0.79;
      vec2 uv = q;
      if (uAspekFoto > ka) uv.x = (q.x - 0.5) * (ka / uAspekFoto) + 0.5;
      else uv.y = (q.y - 0.5) * (uAspekFoto / ka) + 0.5;
      col = texture2D(uFoto, clamp(uv, 0.001, 0.999)).rgb;
      col = mix(col, col * vec3(1.05, 1.0, 0.9), 0.6);
      float dalam = smoothstep(0.218, 0.42, s);
      col *= 0.72 + 0.28 * dalam;
    }
    gl_FragColor = vec4(col, alfa);
  }
`

// Prabha: lingkaran cahaya bergerigi api di belakang foto, berputar pelan
export const FRAG_PRABHA = /* glsl */ `
  precision highp float;
  uniform float uWaktu;
  varying vec2 vP;
  const vec3 HITAM = vec3(0.075, 0.05, 0.04);
  const vec3 EMAS = vec3(0.98, 0.76, 0.22);
  const vec3 JINGGA = vec3(0.9, 0.42, 0.14);
  const vec3 MERAH = vec3(0.65, 0.14, 0.09);

  float gerigi(float a, float n, float geser) {
    float t = fract(a / 6.2831853 * n + geser);
    return 1.0 - abs(t - 0.5) * 2.0;
  }

  void main() {
    float r = length(vP);
    float a = atan(vP.y, vP.x);
    float fw = fwidth(r) + 1e-4;
    float g1 = gerigi(a, 20.0, uWaktu * 0.02);
    float g2 = gerigi(a, 20.0, 0.5 - uWaktu * 0.02);
    float R1 = 0.66 + 0.3 * pow(g1, 0.8);
    float R2 = 0.55 + 0.17 * pow(g2, 0.8);
    vec3 col = vec3(0.0);
    float alfa = 0.0;
    if (r < R1) {
      col = mix(MERAH, JINGGA, smoothstep(0.55, 0.95, r));
      alfa = 1.0;
      float e1 = 1.0 - smoothstep(0.0, fw * 3.0, R1 - r);
      col = mix(col, HITAM, e1);
    }
    if (r < R2) {
      col = mix(JINGGA, EMAS, smoothstep(0.35, 0.6, r));
      float e2 = 1.0 - smoothstep(0.0, fw * 2.6, R2 - r);
      col = mix(col, HITAM, e2);
    }
    if (alfa < 0.5) discard;
    gl_FragColor = vec4(col, 0.97);
  }
`

// Latar kain bermotif halus dengan vinyet
export const VERT_LATAR = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.9999, 1.0);
  }
`
export const FRAG_LATAR = /* glsl */ `
  precision highp float;
  uniform vec2 uResolusi;
  uniform vec2 uGeser;
  uniform float uWaktu;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }

  void main() {
    vec2 p = vUv * uResolusi / 90.0 + uGeser * 0.35;
    // serat kain: garis halus horizontal dan vertikal
    float serat = noise(vec2(p.x * 60.0, p.y * 3.0)) * 0.5 + noise(vec2(p.x * 3.0, p.y * 60.0)) * 0.5;
    float bintik = noise(p * 14.0);
    vec3 dasar = vec3(0.925, 0.81, 0.58);
    vec3 tua = vec3(0.78, 0.55, 0.28);
    vec2 c = vUv - 0.5;
    float vin = smoothstep(0.25, 0.85, length(c * vec2(1.0, 1.1)));
    vec3 col = mix(dasar, tua, vin * 0.85);
    col *= 0.94 + 0.08 * serat + 0.05 * bintik;
    gl_FragColor = vec4(col, 1.0);
  }
`

export const VERT_DEBU = /* glsl */ `
  attribute vec3 aMulai;
  attribute float aSeed;
  uniform float uWaktu;
  uniform float uTinggi;
  uniform float uSkalaPiksel;
  varying float vKedip;
  void main() {
    vec3 p = aMulai;
    p.y = mod(aMulai.y + uWaktu * (0.12 + aSeed * 0.2) + uTinggi * 0.5, uTinggi) - uTinggi * 0.5 + 2.0;
    p.x += sin(uWaktu * 0.5 + aSeed * 20.0) * 0.25;
    vKedip = 0.5 + 0.5 * sin(uWaktu * 2.0 + aSeed * 40.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (3.0 + aSeed * 5.0) * uSkalaPiksel * (14.0 / -mv.z);
  }
`
export const FRAG_DEBU = /* glsl */ `
  precision highp float;
  varying float vKedip;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    vec3 col = mix(vec3(1.0, 0.82, 0.3), vec3(1.0, 0.96, 0.7), smoothstep(0.3, 0.0, d));
    gl_FragColor = vec4(col, a * (0.35 + 0.5 * vKedip));
  }
`
