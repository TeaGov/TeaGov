"use client"

import React from "react"
import { createRoot } from "react-dom/client"
import App from "./tea-protocol"
import "./app/globals.css"

// Asegurarse de que el DOM está completamente cargado antes de montar la aplicación
document.addEventListener("DOMContentLoaded", () => {
  // Buscar el elemento root
  const rootElement = document.getElementById("root")

  if (!rootElement) {
    console.error('Root element not found! Make sure there is a <div id="root"></div> in your HTML')
  } else {
    const root = createRoot(rootElement)

    // Envolver en error boundary para capturar y mostrar errores
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>,
    )
  }
})

// Simple error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "20px",
            margin: "20px",
            border: "1px solid #f44336",
            borderRadius: "4px",
            backgroundColor: "#ffebee",
          }}
        >
          <h2 style={{ color: "#d32f2f" }}>Something went wrong</h2>
          <details style={{ whiteSpace: "pre-wrap" }}>
            <summary>Show error details</summary>
            {this.state.error && this.state.error.toString()}
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "10px",
              padding: "8px 16px",
              backgroundColor: "#1A5F7A",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

