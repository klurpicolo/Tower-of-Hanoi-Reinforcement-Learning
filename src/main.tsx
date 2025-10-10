import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@mantine/core/styles.css";
import "./index.css";
import App from "./App.tsx";
import { Provider } from "jotai";
import { rlStore } from "./state/rlAtoms";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={rlStore}>
      <App />
    </Provider>
  </StrictMode>,
);
