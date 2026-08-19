import React from "react"

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  retry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, () => this.retry())
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 max-w-md">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />

            <h2 className="text-2xl font-bold text-gray-900 mb-2">משהו השתבש</h2>

            <p className="text-gray-500 mb-6">{this.state.error?.message || "שגיאה לא צפויה"}</p>

            <button
              onClick={() => this.retry()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold"
            >
              <RotateCcw className="w-4 h-4" />
              נסה שוב
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
