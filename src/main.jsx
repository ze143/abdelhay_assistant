import "@fortawesome/fontawesome-free/css/all.min.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-center"
      toastOptions={{
        style: { fontFamily: "Tajawal, sans-serif", direction: "rtl" },
      }}
    />
  </StrictMode>,
);
