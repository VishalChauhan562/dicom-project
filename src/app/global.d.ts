declare module "cornerstone-core" {
  interface Cornerstone {
    loadImage: (imageId: string) => Promise<unknown>;
    displayImage: (element: HTMLElement, image: unknown) => void;
    enable: (element: HTMLElement) => void;
    getEnabledElements: () => { element: HTMLElement }[];
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
