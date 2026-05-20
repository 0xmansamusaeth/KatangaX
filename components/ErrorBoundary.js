"use client";

import React from "react";

const SUPPORT_EMAIL = "support@katangax.com";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null, expanded: false };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    if (typeof window !== "undefined" && window?.console) {
      window.console.error("[KatangaX] Unhandled error", error, info);
    }
  }

  reset = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    const err = this.state.error;
    const message = err?.message ?? String(err);
    const stack = err?.stack ?? this.state.info?.componentStack ?? "";

    const mailtoBody = encodeURIComponent(
      `Hi KatangaX team,\n\nI hit an error in the app:\n\n${message}\n\n— Stack —\n${stack.slice(0, 1500)}`,
    );

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7F5] p-6">
        <div className="w-full max-w-md rounded-2xl border border-[#DC2626]/20 bg-white p-6 shadow-lg">
          <div className="text-3xl">😵</div>
          <h1 className="mt-3 text-lg font-bold text-[#1A1A1A]">
            Something went wrong
          </h1>
          <p className="mt-1 text-sm text-[#4B5563]">
            KatangaX encountered an unexpected error. Your data is safe — try
            reloading the app.
          </p>
          <details
            className="mt-4 rounded-lg bg-[#F5F7F5] p-3 text-xs text-[#4B5563]"
            open={this.state.expanded}
            onToggle={(e) => this.setState({ expanded: e.target.open })}
          >
            <summary className="cursor-pointer font-semibold text-[#1A1A1A]">
              Error details
            </summary>
            <p className="mt-2 break-all font-mono">{message}</p>
            {stack ? (
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap font-mono text-[10px]">
                {stack}
              </pre>
            ) : null}
          </details>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={this.reset}
              className="w-full rounded-xl bg-[#1B5E20] py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#164D1A]"
            >
              Reload app
            </button>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=KatangaX%20issue&body=${mailtoBody}`}
              className="text-center text-xs font-medium text-[#1B5E20] underline"
            >
              Report this issue
            </a>
          </div>
        </div>
      </div>
    );
  }
}
