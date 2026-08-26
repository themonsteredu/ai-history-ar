declare module "three";

declare module "mind-ar/dist/mindar-image.prod.js" {
  export class Compiler {
    compileImageTargets(images: HTMLImageElement[], onProgress: (progress: number) => void): Promise<unknown>;
    exportData(): Uint8Array;
  }
}

declare module "mind-ar/dist/mindar-image-three.prod.js" {
  export class MindARThree {
    constructor(options: Record<string, unknown>);
    renderer: {
      domElement: HTMLCanvasElement;
      dispose: () => void;
      render: (scene: unknown, camera: unknown) => void;
      setAnimationLoop: (callback: (() => void) | null) => void;
    };
    scene: unknown;
    camera: unknown;
    addAnchor: (targetIndex: number) => {
      group: { add: (...objects: unknown[]) => void };
      onTargetFound: (() => void) | null;
      onTargetLost: (() => void) | null;
    };
    start: () => Promise<void>;
    stop: () => void;
  }
}
