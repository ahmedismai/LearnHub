import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

registerSW({ immediate: true });

// Robust PWA Install handling
window.learnHubInstallPrompt = null;

const handleInstallPrompt = (event) => {
  // Prevent the default browser mini-infobar from appearing
  event.preventDefault();
  // Stash the event so it can be triggered later.
  window.learnHubInstallPrompt = event;
  // Notify the app that installation is ready
  window.dispatchEvent(new Event("learnhub-install-ready"));
  console.log("LearnHub: PWA Install prompt is ready");
};

window.addEventListener("beforeinstallprompt", handleInstallPrompt);

window.addEventListener("appinstalled", () => {
  window.learnHubInstallPrompt = null;
  window.dispatchEvent(new Event("learnhub-installed"));
  console.log("LearnHub: PWA was installed");
});

createRoot(document.getElementById("root")).render(<App />);
