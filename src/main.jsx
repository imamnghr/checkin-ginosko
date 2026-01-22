import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Toaster } from "react-hot-toast";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <div className="mobile-app">
      <div className="mobile-container">
        <App />
      </div>
    </div>
    <Toaster />
  </StrictMode>,
);
