import React from "react";

export interface SetteraSettingErrorBoundaryProps {
  settingKey: string;
  fallback?: React.ReactNode | ((error: Error, settingKey: string) => React.ReactNode);
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class SetteraSettingErrorBoundary extends React.Component<
  SetteraSettingErrorBoundaryProps,
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        `[Settera] Error rendering setting "${this.props.settingKey}":`,
        error,
        info,
      );
    }
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return typeof this.props.fallback === "function"
          ? this.props.fallback(this.state.error, this.props.settingKey)
          : this.props.fallback;
      }
      return null;
    }
    return this.props.children;
  }
}
