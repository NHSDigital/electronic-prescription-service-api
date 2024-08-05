import * as React from "react"
import {ErrorMessage} from "nhsuk-react-components"

type ErrorBoundaryProps = {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false
    }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return {
      hasError: true
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorMessage>Something went wrong displaying information on this page. See console for details.</ErrorMessage>
      )
    }
    // eslint-disable-next-line react/prop-types
    return this.props.children
  }
}
