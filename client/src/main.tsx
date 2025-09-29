import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('Service Worker registered'))
      .catch(() => console.log('Service Worker registration failed'));
  });
}

createRoot(document.getElementById("root")!).render(<App />);
