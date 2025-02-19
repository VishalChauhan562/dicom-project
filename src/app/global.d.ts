declare module "cornerstone-core" {
  interface Viewport {
    scale: number;
    translation: {
      x: number;
      y: number;
    };
    voi: {
      windowWidth: number;
      windowCenter: number;
    };
    invert: boolean;
    pixelReplication: boolean;
    rotation: number;
    hflip: boolean;
    vflip: boolean;
    modalityLUT?: Record<string, unknown>;
    voiLUT?: Record<string, unknown>;
  }

  interface Cornerstone {
    loadImage: (imageId: string) => Promise<unknown>;
    displayImage: (element: HTMLElement, image: unknown) => void;
    enable: (element: HTMLElement) => void;
    getEnabledElements: () => { element: HTMLElement }[];
    setViewport: (element: HTMLElement, viewport: Viewport) => void;
    getViewport: (element: HTMLElement) => Viewport;
  }
  const cornerstone: Cornerstone;
  export default cornerstone;
}

declare module "cornerstone-wado-image-loader" {
  interface CornerstoneWADOImageLoader {
    wadouri: {
      fileManager: {
        add: (file: File) => string;
      };
    };
    external: {
      cornerstone: unknown;
      dicomParser: unknown;
    };
  }
  const cornerstoneWADOImageLoader: CornerstoneWADOImageLoader;
  export default cornerstoneWADOImageLoader;
}

declare module "dicom-parser" {
  interface DicomParser {
    parseDicom: (byteArray: Uint8Array) => unknown;
  }
  const dicomParser: DicomParser;
  export default dicomParser;
}
