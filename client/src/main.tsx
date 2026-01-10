import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import TestApp from "./TestApp";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

// Temporary test - use TestApp to see if basic React rendering works
const USE_TEST_APP = false;

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      {USE_TEST_APP ? <TestApp /> : <App />}
    </ErrorBoundary>
  </React.StrictMode>
);
