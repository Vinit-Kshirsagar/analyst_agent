import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Autonomous Security Agent | SOC Analyst Operations Console",
  description: "Local-first AI assistant for SOC analysts: FastAPI, LangGraph, Elastic MCP, Ollama & Elasticsearch.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
