import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installNetworkMonitor } from "./lib/networkMonitor";

// Track all server requests so the custom cursor can show a loading state.
installNetworkMonitor();

createRoot(document.getElementById("root")!).render(<App />);
