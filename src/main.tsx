import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Import the dev tools and initialize them
/* import { TempoDevtools } from 'tempo-devtools'; [deprecated] */
/* TempoDevtools.init() [deprecated] */ ReactDOM.createRoot(
  document.getElementById("root")!,
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
