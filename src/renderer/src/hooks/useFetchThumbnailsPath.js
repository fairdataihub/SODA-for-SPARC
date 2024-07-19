import { useEffect, useState } from "react";

const useFetchThumbnailsPath = () => {
  const [guidedThumbnailsPath, setGuidedThumbnailsPath] = useState("");

  useEffect(() => {
    const fetchPath = async () => {
      const homeDir = await window.electron.ipcRenderer.invoke("get-app-path", "home");
      const path = window.path.join(homeDir, "SODA", "Guided-Image-Thumbnails");
      setGuidedThumbnailsPath(path);
    };
    fetchPath();
  }, []);

  return guidedThumbnailsPath;
};

export default useFetchThumbnailsPath;
