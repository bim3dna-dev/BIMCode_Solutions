import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import LocaleProvider from "./i18n/LocaleProvider.jsx";
import App from "./App.jsx";
import "./index.css";
import ThemeProvider from "./theme/ThemeProvider.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <LocaleProvider>
          <App />
        </LocaleProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
