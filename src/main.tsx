import React from "react";
import ReactDOM from "react-dom/client";
import { WordNotebook } from "../app/word-notebook";
import "../app/globals.css";
import "../app/fonts.css";
import "../app/quick-add.css";
import "../app/auth.css";

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><WordNotebook /></React.StrictMode>);
