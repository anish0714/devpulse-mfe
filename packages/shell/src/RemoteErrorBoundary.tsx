import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  remoteName: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class RemoteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Failed to load remote "${this.props.remoteName}":`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 20,
            border: "1px dashed #f85149",
            borderRadius: 10,
            color: "#f85149",
            fontSize: 13,
            maxWidth: 420,
          }}
        >
          Failed to load the <strong>{this.props.remoteName}</strong> remote.
          It may not be deployed yet, or is temporarily unavailable.
        </div>
      );
    }
    return this.props.children;
  }
}
