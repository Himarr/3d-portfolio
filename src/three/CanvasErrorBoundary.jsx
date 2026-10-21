import { Component } from 'react'

// Catches errors thrown while rendering the canvas tree (scene, model load)
// and renders nothing; the parent switches to the fallback via onError.
export default class CanvasErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    this.props.onError?.(error)
    if (import.meta.env.DEV) console.error(error)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
