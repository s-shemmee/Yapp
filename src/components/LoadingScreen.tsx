import React from "react";
import { dotStream } from "ldrs";
import "./LoadingScreen.scss";

if (!customElements.get("l-dot-stream")) {
  dotStream.register();
}

interface LoadingScreenProps {
  label?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ label = "Loading…" }) => (
  <div className="loading-screen" role="status" aria-live="polite">
    {React.createElement("l-dot-stream", { size: "60", speed: "2.5", color: "white" })}
    <span className="visuallyHidden">{label}</span>
  </div>
);

export default LoadingScreen;
