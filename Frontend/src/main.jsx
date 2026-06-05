import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

registerSW({ immediate: true });

// Robust PWA Install handling
window.learnHubInstallPrompt = null;
let deferredPrompt = null;

// Global install function accessible from anywhere
window.installApp = async () => {
  const prompt = deferredPrompt || window.learnHubInstallPrompt;
  if (!prompt) {
    return { success: false };
  }

  try {
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    deferredPrompt = null;
    window.learnHubInstallPrompt = null;
    window.dispatchEvent(new Event("learnhub-install-status-changed"));
    
    if (outcome === "accepted") {
      console.log("LearnHub: User accepted the install prompt");
      return { success: true };
    } else {
      console.log("LearnHub: User dismissed the install prompt");
      return { success: false };
    }
  } catch (err) {
    console.error("LearnHub: Installation error", err);
    return { success: false, error: err };
  }
};

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  window.learnHubInstallPrompt = event; // Keep for compatibility if needed
  window.dispatchEvent(new Event("learnhub-install-ready"));
  window.dispatchEvent(new Event("learnhub-install-status-changed"));
  console.log("LearnHub: PWA Install prompt is captured and ready");
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  window.learnHubInstallPrompt = null;
  window.dispatchEvent(new Event("learnhub-installed"));
  window.dispatchEvent(new Event("learnhub-install-status-changed"));
  console.log("LearnHub: PWA was successfully installed");
});

createRoot(document.getElementById("root")).render(<App />);
