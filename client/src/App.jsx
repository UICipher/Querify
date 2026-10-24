import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import GlowCursor from "./components/GlowCursor";

export default function App() {
  return (
    <ErrorBoundary>
      <>
        <GlowCursor
          className="global-glow-cursor"
          style={{ position: "fixed", inset: 0, zIndex: 2, pointerEvents: "none" }}
        />
        <Home />
      </>
    </ErrorBoundary>
  );
}
