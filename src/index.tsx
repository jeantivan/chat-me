import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import {
  DarkModeProvider,
  UserInfoProvider,
  ContactInfoProvider,
  LeftDrawerProvider,
} from "./components";

import { QueryClient, QueryClientProvider } from "react-query";

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <DarkModeProvider>
        <LeftDrawerProvider>
          <UserInfoProvider>
            <ContactInfoProvider>
              <App />
            </ContactInfoProvider>
          </UserInfoProvider>
        </LeftDrawerProvider>
      </DarkModeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
