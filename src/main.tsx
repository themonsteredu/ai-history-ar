import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { App } from "./App";
import { CareerLogLessonOneBridge } from "./components/CareerLogLessonOneBridge";
import "./styles/global.css";
import "./styles/classroom-start.css";

const rootElement = document.getElementById("root");
const Router = import.meta.env.BASE_URL === "/" ? BrowserRouter : HashRouter;

if (!rootElement) {
  throw new Error("앱을 표시할 #root 요소를 찾을 수 없습니다.");
}

createRoot(rootElement).render(
  <StrictMode>
    <Router>
      <App />
      <CareerLogLessonOneBridge />
    </Router>
  </StrictMode>,
);
