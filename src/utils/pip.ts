let pipWindow: any = null;

export const openPiP = async (
  width: number = 300, 
  height: number = 100
): Promise<Document | null> => {
  if (typeof window === 'undefined' || !('documentPictureInPicture' in window)) {
    return null;
  }
  
  if (pipWindow) {
    pipWindow.close();
  }

  try {
    const documentPictureInPicture = (window as any).documentPictureInPicture;
    pipWindow = await documentPictureInPicture.requestWindow({
      width,
      height
    });

    // Handle closure
    pipWindow.addEventListener("pagehide", () => {
      pipWindow = null;
    });

    // Copy styles from main document to PiP document
    const mainDocsStyles = Array.from(document.styleSheets);
    for (const styleSheet of mainDocsStyles) {
      try {
        const cssRules = [];
        for (const rule of Object.values(styleSheet.cssRules)) {
          cssRules.push(rule.cssText);
        }
        const style = document.createElement('style');
        style.textContent = cssRules.join('');
        pipWindow.document.head.appendChild(style);
      } catch (e) {
        if (styleSheet.href) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = styleSheet.href;
          pipWindow.document.head.appendChild(link);
        }
      }
    }

    pipWindow.document.body.className = "bg-black text-white m-0 h-full w-full flex items-center justify-center p-2 font-mono";

    return pipWindow.document;
  } catch (err) {
    console.error("Document PiP failed:", err);
    return null;
  }
};

export const closePiP = () => {
  if (pipWindow) {
    pipWindow.close();
    pipWindow = null;
  }
};

export const updatePiPContent = (htmlContent: string) => {
  if (pipWindow && pipWindow.document) {
    pipWindow.document.body.innerHTML = htmlContent;
  }
};

export const isPiPOpen = () => {
  return pipWindow !== null;
};
