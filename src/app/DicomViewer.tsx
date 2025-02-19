"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const DicomViewer = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const [dicomInfo, setDicomInfo] = useState<Record<string, string>>({});
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(1);
  const imageIdsRef = useRef<string[]>([]);
  const dataSetRef = useRef<unknown | null>(null); // Fixed typing

  useEffect(() => {
    const loadCornerstone = async () => {
      try {
        const cornerstone = (await import("cornerstone-core")).default;
        const cornerstoneWADOImageLoader = (
          await import("cornerstone-wado-image-loader")
        ).default;
        const dicomParser = (await import("dicom-parser")).default;

        cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
        cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
      } catch (error) {
        console.error("Error initializing Cornerstone:", error);
      }
    };

    loadCornerstone();
  }, []);

  const extractMetadata = (frameIndex = 0) => {
    if (!dataSetRef.current) return;
    const dataSet = dataSetRef.current as {
      string: (tag: string) => string | undefined;
      uint16: (tag: string) => number | undefined;
    }; // Safe type assertion

    const metadata: Record<string, string> = {
      "Transfer Syntax": dataSet.string("x00020010") || "N/A",
      SOPClassUID: dataSet.string("x00080016") || "N/A",
      SOPInstanceUID: dataSet.string("x00080018") || "N/A",
      Rows: dataSet.uint16("x00280010")?.toString() || "N/A",
      Columns: dataSet.uint16("x00280011")?.toString() || "N/A",
      Frames: totalFrames.toString(),
      Modality: dataSet.string("x00080060") || "N/A",
      "Bits Allocated": dataSet.uint16("x00280100")?.toString() || "N/A",
      "Bits Stored": dataSet.uint16("x00280101")?.toString() || "N/A",
      "High Bit": dataSet.uint16("x00280102")?.toString() || "N/A",
      "Photometric Interpretation": dataSet.string("x00280004") || "N/A",
      "Window Width": dataSet.string(`x00281051[${frameIndex}]`) || "N/A",
      "Window Center": dataSet.string(`x00281050[${frameIndex}]`) || "N/A",
    };

    setDicomInfo(metadata);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const cornerstone = (await import("cornerstone-core")).default;
    const cornerstoneWADOImageLoader = (
      await import("cornerstone-wado-image-loader")
    ).default;
    const dicomParser = (await import("dicom-parser")).default;

    const reader = new FileReader();
    reader.onload = function (e) {
      if (!e.target?.result) return;
      const arrayBuffer = e.target.result as ArrayBuffer;
      const byteArray = new Uint8Array(arrayBuffer);
      const dataSet = dicomParser.parseDicom(byteArray) as {
        intString: (tag: string) => string | undefined;
      };
      dataSetRef.current = dataSet;

      const frames = parseInt(dataSet.intString("x00280008") || "1", 10);

      setTotalFrames(frames);
      setCurrentFrame(0);

      const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file);
      imageIdsRef.current = Array.from(
        { length: frames },
        (_, i) => `${imageId}?frame=${i}`
      );

      const element = elementRef.current;
      if (!element) return;

      if (
        !cornerstone
          .getEnabledElements()
          .some((el: { element: HTMLElement }) => el.element === element)
      ) {
        cornerstone.enable(element);
      }

      cornerstone.loadImage(imageIdsRef.current[0]).then((image) => {
        const loadedImage = image as cornerstone.Image; // ✅ Type assertion
        cornerstone.displayImage(element, loadedImage);
        extractMetadata(0);
      });
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFrameChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newFrame = parseInt(event.target.value, 10);
    if (newFrame >= 0 && newFrame < totalFrames) {
      setCurrentFrame(newFrame);

      const cornerstone = (await import("cornerstone-core")).default;
      cornerstone.loadImage(imageIdsRef.current[newFrame]).then((image) => {
        const loadedImage = image as unknown as cornerstone.Image; // ✅ Type assertion

        const element = elementRef.current;
        if (!element) return;

        cornerstone.displayImage(element, loadedImage);
        extractMetadata(newFrame);
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-100 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">
        DICOM Viewer
      </h1>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex flex-col items-center bg-white p-4 rounded-lg shadow-md w-full md:w-1/2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".dcm"
            className="px-4 py-2 border rounded-lg bg-blue-500 text-white cursor-pointer mb-4"
          />

          <div
            ref={elementRef}
            className="border border-gray-400 bg-black rounded-lg"
            style={{ width: "512px", height: "512px" }}
          />

          {totalFrames > 1 && (
            <div className="mt-4 w-full text-center">
              <input
                type="range"
                min="0"
                max={totalFrames - 1}
                value={currentFrame}
                onChange={handleFrameChange}
                className="w-full"
              />
              <p className="text-lg font-semibold mt-2 text-gray-700">
                Frame {currentFrame + 1} / {totalFrames}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col bg-white p-4 rounded-lg shadow-md w-full md:w-1/2">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            DICOM Metadata
          </h2>
          <div className="overflow-auto max-h-[520px] border border-gray-300 rounded-lg">
            <table className="min-w-full bg-white">
              <tbody>
                {Object.entries(dicomInfo).map(([key, value]) => (
                  <tr key={key} className="border-b border-gray-200">
                    <td className="px-4 py-2 font-medium text-gray-700">
                      {key}
                    </td>
                    <td className="px-4 py-2 text-gray-600">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(DicomViewer), { ssr: false });
