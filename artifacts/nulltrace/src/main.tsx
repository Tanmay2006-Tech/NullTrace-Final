import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";
import { API_URL } from "@/lib/api";

setBaseUrl(API_URL);

createRoot(document.getElementById("root")!).render(<App />);
