import React from "react";
import ReactDOM from "react-dom/client";
import "@/styles/index.css";
import App from "./App";
import { DarkModeProvider } from "@/components";

import { QueryClient, QueryClientProvider } from "react-query";

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <DarkModeProvider>
        <App />
      </DarkModeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
