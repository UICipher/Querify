import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./theme-refresh.css";
import "./index.css";

const rootElement =
  document.getElementById("root") ??
  (() => {
    const root = document.createElement("div");
    root.id = "root";
    document.body.appendChild(root);
    return root;
  })();

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
