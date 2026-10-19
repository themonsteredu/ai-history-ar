import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type Vec = [number, number, number];
/** [left, top, right, bottom] in 0..1 photo coordinates, top-left origin. */
export type Rect = [number, number, number, number];
type Geometry = InstanceType<typeof THREE.BufferGeometry>;
type Object3D = InstanceType<typeof THREE.Object3D>;
type Mesh = InstanceType<typeof THREE.Mesh>;

export type Surface = 'bronze' | 'darkBronze' | 'stone' | 'darkStone' | 'wood' | 'paper' | 'ink' | 'thread' | 'gold' | 'water';
const PALETTE: Record<Surface, { color: string; roughness: number; metalness: number }> = {
  bronze: { color: '#6f5b43', roughness: .5, metalness: .55 },
  darkBronze: { color: '#3b3632', roughness: .55, metalness: .5 },
  stone: { color: '#c7c1b4', roughness: .95, metalness: 0 },
  darkStone: { color: '#8f897d', roughness: .95, metalness: 0 },
  wood: { color: '#8a5a36', roughness: .8, metalness: 0 },
  paper: { color: '#e4d5b2', roughness: .9, metalness: 0 },
  ink: { color: '#2d2925', roughness: .9, metalness: 0 },
  thread: { color: '#a8322b', roughness: .8, metalness: 0 },
  gold: { color: '#b39150', roughness: .4, metalness: .7 },
  water: { color: '#6f93a8', roughness: .2, metalness: 0 },
};

/**
 * How one photograph region was taken: an orthographic view from `elevation` degrees above the
 * horizon and `azimuth` degrees around the vertical (0 = from the model's front, +z), and where the
 * region's outline sits in the photo. Every vertex of the region is projected along that view, so
 * the parts the camera saw receive the matching pixels.
 */
export interface PhotoView { elevation: number; azimuth: number; frame: Rect }
export interface JoseonPhoto { path: string; source: string; author: string; license: string; licenseUrl: string; views: Record<string, PhotoView> }

interface Entry { mesh: Mesh; surface: Surface; region?: string; weather: number }

/** Collects the meshes of one teaching reconstruction, then textures, merges and returns them. */
export class ReconstructionBuilder {
  readonly root = new THREE.Group();
  readonly features: string[] = [];
  private readonly entries: Entry[] = [];

  feature(name: string) { this.features.push(name); }

  /** Adds a geometry. `region` names the photo region (see PhotoView) whose pixels cover it. */
  add(geometry: Geometry, surface: Surface, options: { position?: Vec; rotation?: Vec; scale?: Vec; region?: string; parent?: Object3D; weather?: number } = {}) {
    const mesh = new THREE.Mesh(geometry);
    if (options.position) mesh.position.set(...options.position);
    if (options.rotation) mesh.rotation.set(...options.rotation);
    if (options.scale) mesh.scale.set(...options.scale);
    (options.parent || this.root).add(mesh);
    this.entries.push({ mesh, surface, region: options.region, weather: options.weather || 0 });
    return mesh;
  }
  /** Rounded box (centered on `position`). */
  box(size: Vec, position: Vec, surface: Surface, options: { rotation?: Vec; region?: string; parent?: Object3D; bevel?: number; weather?: number } = {}) {
    const [w, h, d] = size, bevel = Math.min(options.bevel ?? .006, w / 4, h / 4, d / 4), shape = new THREE.Shape();
    shape.moveTo(-w / 2 + bevel, -h / 2 + bevel); shape.lineTo(w / 2 - bevel, -h / 2 + bevel);
    shape.lineTo(w / 2 - bevel, h / 2 - bevel); shape.lineTo(-w / 2 + bevel, h / 2 - bevel); shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: d - bevel * 2, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1, steps: 1, curveSegments: 1 });
    g.translate(0, 0, -d / 2 + bevel);
    return this.add(g, surface, { ...options, position });
  }
  /** Solid of revolution around the vertical axis; `profile` is [radius, height] pairs from bottom to top. */
  lathe(profile: Array<[number, number]>, surface: Surface, options: { position?: Vec; rotation?: Vec; region?: string; parent?: Object3D; segments?: number } = {}) {
    return this.add(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), options.segments || 48), surface, options);
  }
  cylinder(radiusTop: number, radiusBottom: number, height: number, position: Vec, surface: Surface, options: { rotation?: Vec; region?: string; parent?: Object3D; segments?: number; open?: boolean } = {}) {
    return this.add(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, options.segments || 40, 1, !!options.open), surface, { ...options, position });
  }
  /** A ring (torus). With no rotation the ring lies flat (horizontal); `rotation` tilts it. */
  ring(radius: number, tube: number, position: Vec, surface: Surface, options: { rotation?: Vec; region?: string; parent?: Object3D; radial?: number; segments?: number; arc?: number } = {}) {
    const g = new THREE.TorusGeometry(radius, tube, options.radial || 6, options.segments || 72, options.arc ?? Math.PI * 2);
    g.rotateX(Math.PI / 2);
    return this.add(g, surface, { ...options, position });
  }
  /** Flat band ring with a rectangular cross-section (like engraved instrument rings). */
  band(radius: number, width: number, thickness: number, position: Vec, surface: Surface, options: { rotation?: Vec; region?: string; parent?: Object3D; segments?: number } = {}) {
    const outer = radius + thickness / 2, inner = radius - thickness / 2, shape = new THREE.Shape();
    shape.absarc(0, 0, outer, 0, Math.PI * 2, false);
    const hole = new THREE.Path(); hole.absarc(0, 0, inner, 0, Math.PI * 2, true); shape.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false, curveSegments: options.segments || 64 });
    g.translate(0, 0, -width / 2); g.rotateX(Math.PI / 2);
    return this.add(g, surface, { ...options, position });
  }
  tube(points: Vec[], radius: number, surface: Surface, options: { region?: string; parent?: Object3D; segments?: number; radial?: number; closed?: boolean } = {}) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), !!options.closed);
    return this.add(new THREE.TubeGeometry(curve, options.segments || 24, radius, options.radial || 8, !!options.closed), surface, options);
  }
  sphere(radius: number, position: Vec, surface: Surface, options: { scale?: Vec; region?: string; parent?: Object3D; segments?: number } = {}) {
    return this.add(new THREE.SphereGeometry(radius, options.segments || 24, Math.max(8, Math.round((options.segments || 24) / 2))), surface, { ...options, position });
  }
  /** Extruded flat shape; the shape is drawn in the x/y plane and extruded toward +z. */
  extrude(shape: InstanceType<typeof THREE.Shape>, depth: number, surface: Surface, options: { position?: Vec; rotation?: Vec; region?: string; parent?: Object3D; bevel?: number } = {}) {
    const bevel = options.bevel ?? .002;
    return this.add(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, steps: 1, curveSegments: 10 }), surface, options);
  }

  /** Textures the photo regions (when a photo is given and wanted), merges by material and returns the root. */
  async finish(photo: JoseonPhoto | undefined, withImages: boolean) {
    const root = this.root;
    root.updateMatrixWorld(true);
    const noise = (x: number, y: number, z: number) => Math.sin(x * 87.7 + y * 47.3 + z * 91.1) * Math.sin(x * 31.2 - y * 113.8 + z * 21.7);
    // Bake transforms first so photo projection sees final positions.
    const baked = this.entries.map(entry => {
      const copy = entry.mesh.geometry.clone().applyMatrix4(entry.mesh.matrixWorld);
      const geometry = copy.index ? copy.toNonIndexed() : copy;
      if (geometry !== copy) copy.dispose();
      const p = geometry.getAttribute('position'), colors = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = noise(x, y, z);
        if (entry.weather) p.setXYZ(i, x + n * entry.weather, y + noise(y, z, x) * entry.weather, z + noise(z, x, y) * entry.weather);
        const shade = 1 - (n + 1) * .05;
        colors.set([shade, shade, shade], i * 3);
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      if (entry.weather || !geometry.getAttribute('normal')) geometry.computeVertexNormals();
      if (!geometry.getAttribute('uv')) geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(p.count * 2), 2));
      return { ...entry, geometry };
    });
    const views = photo?.views || {};
    for (const [region, view] of Object.entries(views)) {
      const members = baked.filter(entry => entry.region === region);
      if (!members.length) continue;
      const el = view.elevation * Math.PI / 180, az = view.azimuth * Math.PI / 180;
      const toCamera = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
      const right = new THREE.Vector3(Math.cos(az), 0, -Math.sin(az));
      const up = new THREE.Vector3().crossVectors(toCamera, right);
      const v = new THREE.Vector3();
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const { geometry } of members) {
        const p = geometry.getAttribute('position');
        for (let i = 0; i < p.count; i++) {
          v.fromBufferAttribute(p, i);
          const sx = v.dot(right), sy = v.dot(up);
          minX = Math.min(minX, sx); maxX = Math.max(maxX, sx); minY = Math.min(minY, sy); maxY = Math.max(maxY, sy);
        }
      }
      const [l, t, r, b] = view.frame, clamp = (n: number) => Math.max(0, Math.min(1, n));
      for (const { geometry } of members) {
        const p = geometry.getAttribute('position'), uv = geometry.getAttribute('uv');
        for (let i = 0; i < p.count; i++) {
          v.fromBufferAttribute(p, i);
          const u = l + (v.dot(right) - minX) / (maxX - minX || 1) * (r - l);
          const top = t + (maxY - v.dot(up)) / (maxY - minY || 1) * (b - t);
          uv.setXY(i, clamp(u), clamp(1 - top));
        }
        uv.needsUpdate = true;
      }
    }

    const materials = new Map<string, InstanceType<typeof THREE.MeshStandardMaterial>>();
    const material = (surface: Surface, region?: string) => {
      const key = `${surface}|${region && views[region] ? region : ''}`;
      let found = materials.get(key);
      if (!found) {
        const look = PALETTE[surface];
        found = new THREE.MeshStandardMaterial({ color: look.color, roughness: look.roughness, metalness: look.metalness, vertexColors: true, side: THREE.DoubleSide, envMapIntensity: .7 });
        found.userData.region = region && views[region] ? region : undefined;
        materials.set(key, found);
      }
      return found;
    };
    baked.forEach(entry => material(entry.surface, entry.region));
    root.userData.photoPending = !photo;
    if (photo && withImages && [...materials.values()].some(item => item.userData.region)) {
      try {
        const texture = await new THREE.TextureLoader().loadAsync(`${import.meta.env.BASE_URL}${photo.path}`);
        texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
        for (const item of materials.values()) if (item.userData.region) {
          item.map = texture; item.color.set('#ffffff');
          // A photograph already carries its own shading and reflections.
          item.metalness = Math.min(item.metalness, .25); item.roughness = Math.max(item.roughness, .55); item.needsUpdate = true;
        }
        root.userData.photoTextureLoaded = true;
      } catch { root.userData.photoTextureLoaded = false; }
    }

    const buckets = new Map<InstanceType<typeof THREE.MeshStandardMaterial>, Geometry[]>();
    for (const entry of baked) {
      const mat = material(entry.surface, entry.region), list = buckets.get(mat) || [];
      list.push(entry.geometry); buckets.set(mat, list);
    }
    const originals = new Set(this.entries.map(entry => entry.mesh.geometry));
    root.clear(); originals.forEach(geometry => geometry.dispose());
    for (const [mat, geometries] of buckets) {
      // Merging needs the same attribute set on every geometry; drop extras some generators add.
      geometries.forEach(geometry => Object.keys(geometry.attributes).forEach(name => { if (!['position', 'normal', 'uv', 'color'].includes(name)) geometry.deleteAttribute(name); }));
      const combined = mergeGeometries(geometries, false);
      if (!combined) throw new Error('재현 모형을 합치지 못했어요.');
      root.add(new THREE.Mesh(combined, mat)); geometries.forEach(geometry => geometry.dispose());
    }
    root.userData.features = [...this.features];
    return root;
  }
}
