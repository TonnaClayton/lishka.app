import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if (typeof window !== "undefined" && import.meta.env.VITE_CAPACITOR) {
  const isIOS = /iPhone|iPad|iPod/i.test(window.navigator.userAgent);
  if (isIOS) {
    document.documentElement.classList.add("native-ios");
  }
}

if (typeof window !== "undefined" && !import.meta.env.VITE_CAPACITOR) {
  import("./pwa");
}

// Import the dev tools and initialize them
/* import { TempoDevtools } from 'tempo-devtools'; [deprecated] */
/* TempoDevtools.init() [deprecated] */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
