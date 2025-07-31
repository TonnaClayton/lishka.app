import html2canvas from "html2canvas";

export interface ExportOptions {
  width?: number;
  height?: number;
  quality?: number;
  backgroundColor?: string;
  scale?: number;
}

/**
 * Converts a DOM element to a canvas and returns it as a blob
 */
export const elementToImage = async (
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<Blob> => {
  const {
    width,
    height,
    quality = 0.9,
    backgroundColor = "transparent",
  } = options;

  const canvas = await html2canvas(element, {
    allowTaint: true,
    useCORS: true,
    background: backgroundColor,
    width,
    height,
    logging: false,
  });

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          throw new Error("Failed to convert canvas to blob");
        }
      },
      "image/png",
      quality
    );
  });
};

/**
 * Creates a temporary DOM element with the FishInfoOverlay content and exports it as an image
 */
export const exportFishInfoOverlayAsImage = async (
  metadata: any,
  originalImageUrl: string,
  options: ExportOptions = {}
): Promise<Blob> => {
  // Get original image dimensions
  const getImageDimensions = (): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        // Fallback dimensions if image fails to load
        resolve({ width: 400, height: 300 });
      };
      img.src = originalImageUrl;
    });
  };

  const { width: originalWidth, height: originalHeight } =
    await getImageDimensions();

  // Create a temporary container with original image dimensions
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.style.width = `${originalWidth}px`;
  container.style.height = `${originalHeight}px`;
  container.style.overflow = "hidden";
  container.style.borderRadius = "12px";
  container.style.backgroundColor = "#000";

  // Create the image element
  const img = document.createElement("img");
  img.src = originalImageUrl;
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "cover";
  img.style.position = "absolute";
  img.style.top = "0";
  img.style.left = "0";

  // Create the overlay container
  const overlay = document.createElement("div");
  overlay.style.position = "absolute";
  overlay.style.inset = "0";
  overlay.style.background =
    "linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.2), transparent)";
  overlay.style.pointerEvents = "none";
  overlay.style.zIndex = "10";

  // Create the content container
  const content = document.createElement("div");
  content.style.position = "absolute";
  content.style.bottom = "0";
  content.style.left = "0";
  content.style.right = "0";
  content.style.padding = "16px";
  content.style.color = "white";
  content.style.textShadow = "0 2px 4px rgba(0,0,0,0.8)";

  // Extract fish information
  const fishInfo = metadata?.fishInfo;
  const location = metadata?.location;

  const fishName = fishInfo?.name;
  const fishSize = fishInfo?.estimatedSize;
  const fishWeight = fishInfo?.estimatedWeight;
  const confidence = fishInfo?.confidence || 0;

  // Determine valid data
  const hasValidFishName =
    fishName &&
    fishName !== "Unknown" &&
    fishName.trim() !== "" &&
    fishName.toLowerCase() !== "unknown";
  const hasValidFishSize =
    fishSize &&
    fishSize !== "Unknown" &&
    fishSize.trim() !== "" &&
    fishSize.toLowerCase() !== "unknown";
  const hasValidFishWeight =
    fishWeight &&
    fishWeight !== "Unknown" &&
    fishWeight.trim() !== "" &&
    fishWeight.toLowerCase() !== "unknown";
  const hasAnyFishData =
    hasValidFishName || hasValidFishSize || hasValidFishWeight;
  const shouldShowConfidence =
    hasValidFishName && confidence > 0 && !metadata.userConfirmed;

  // Create fish information HTML
  let fishInfoHTML = "";

  if (hasAnyFishData) {
    if (hasValidFishName) {
      fishInfoHTML += `
        <div style="position: relative; margin-bottom: 12px; height: 24px;">
          <div style="position: absolute; top: 50%; transform: translateY(-50%); display: inline-block;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: white; vertical-align: middle; display: inline-block;"><path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z"/><path d="M18 12v.5"/><path d="M16 17.93a9.77 9.77 0 0 1 0-11.86"/><path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33"/><path d="M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4"/><path d="m16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98"/></svg>
            <span style="font-weight: 600; font-size: 18px; color: white; line-height: 1; vertical-align: middle; margin-left: 8px; display: inline-block;">${fishName}</span>
            ${shouldShowConfidence ? `<div style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); font-size: 12px; padding: 4px 8px; border-radius: 6px; text-align: center; height: 24px; line-height: 16px; display: inline-block; margin-left: 8px; vertical-align: middle;">${Math.round(confidence * 100)}% confident</div>` : ""}
          </div>
        </div>
      `;
    } else {
      fishInfoHTML += `
        <div style="position: relative; margin-bottom: 12px; height: 24px;">
          <div style="position: absolute; top: 50%; transform: translateY(-50%); display: inline-block;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: white; vertical-align: middle; display: inline-block;"><path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z"/><path d="M18 12v.5"/><path d="M16 17.93a9.77 9.77 0 0 1 0-11.86"/><path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33"/><path d="M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4"/><path d="m16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98"/></svg>
            <span style="font-weight: 600; font-size: 18px; color: white; line-height: 1; vertical-align: middle; margin-left: 8px; display: inline-block;">Fish Detected</span>
          </div>
        </div>
      `;
    }

    // Add size and weight details
    if (hasValidFishSize || hasValidFishWeight) {
      if (hasValidFishSize) {
        fishInfoHTML += `
          <div style="position: relative; margin-bottom: 8px; height: 20px;">
            <div style="position: absolute; top: 50%; transform: translateY(-50%); display: inline-block;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: white; vertical-align: middle; display: inline-block;"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></svg>
              <span style="color: white; line-height: 1; font-size: 14px; vertical-align: middle; margin-left: 8px; display: inline-block;">Size: ${fishSize}</span>
            </div>
          </div>
        `;
      }

      if (hasValidFishWeight) {
        fishInfoHTML += `
          <div style="position: relative; margin-bottom: 8px; height: 20px;">
            <div style="position: absolute; top: 50%; transform: translateY(-50%); display: inline-block;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: white; vertical-align: middle; display: inline-block;"><circle cx="12" cy="5" r="3"/><path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z"/></svg>
              <span style="color: white; line-height: 1; font-size: 14px; vertical-align: middle; margin-left: 8px; display: inline-block;">Weight: ${fishWeight}</span>
            </div>
          </div>
        `;
      }
    }
  } else {
    fishInfoHTML += `
      <div style="position: relative; margin-bottom: 12px; height: 24px;">
        <div style="position: absolute; top: 50%; transform: translateY(-50%); display: inline-block;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: white; vertical-align: middle; display: inline-block;">
            <path d="M6 5c.5.5 1 2 1 3 0 1.5-.5 2.5-1 3.5s-1 2-1 3.5.5 3 1 3.5"/>
            <path d="M18 5c.5.5-1 2-1 3 0 1.5.5 2.5 1 3.5s1 2 1 3.5-.5 3-1 3.5"/>
            <path d="M6 5c.5.5 1 2 1 3 0 1.5-.5 2.5-1 3.5s-1 2-1 3.5.5 3 1 3.5"/>
            <path d="M18 5c.5.5-1 2-1 3 0 1.5.5 2.5 1 3.5s1 2 1 3.5-.5 3-1 3.5"/>
          </svg>
          <span style="font-weight: 600; font-size: 18px; color: white; line-height: 1; vertical-align: middle; margin-left: 8px; display: inline-block;">${fishInfo ? "AI Analysis Failed" : "AI Info Missing"}</span>
        </div>
      </div>
    `;
  }

  // Add logo
  fishInfoHTML += `
    <div style="padding-top: 4px; position: relative; z-index: 20;">
      <img src="/images/Logo.png" alt="Lishka Logo" style="height: 32px; width: auto; object-fit: contain;">
    </div>
  `;

  content.innerHTML = fishInfoHTML;

  // Assemble the DOM structure
  overlay.appendChild(content);
  container.appendChild(img);
  container.appendChild(overlay);
  document.body.appendChild(container);

  try {
    // Wait for the image to load
    await new Promise((resolve) => {
      if (img.complete) {
        resolve(null);
      } else {
        img.onload = () => resolve(null);
        img.onerror = () => resolve(null);
      }
    });

    // Convert to image
    const blob = await elementToImage(container, options);
    return blob;
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
};
