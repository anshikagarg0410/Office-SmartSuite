import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { BrowserRouter } from "react-router-dom";
  import { AuthProvider } from './auth.tsx';
  import { Toaster } from './components/ui/sonner.tsx'; // Import Toaster

  createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster richColors position="bottom-right" />
      </AuthProvider>
    </BrowserRouter>
  );
