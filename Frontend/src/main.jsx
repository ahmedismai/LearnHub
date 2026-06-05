import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

registerSW({ immediate: true });

window.learnHubInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  window.learnHubInstallPrompt = event;
  window.dispatchEvent(new Event("learnhub-install-ready"));
});

window.addEventListener("appinstalled", () => {
  window.learnHubInstallPrompt = null;
  window.dispatchEvent(new Event("learnhub-installed"));
});

createRoot(document.getElementById("root")).render(<App />);
