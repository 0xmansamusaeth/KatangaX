"use client";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { TransactionRecovery } from "@/components/web3/TransactionRecovery";
import { WalletMismatchBlocker } from "@/components/web3/WalletMismatchBlocker";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import { AuthProvider } from "@/components/auth/AuthContext";

/**
 * Client-side shell: keeps the root layout server-rendered while wrapping
 * the tree in an error boundary, global banners, the auth context (which
 * also owns the AuthPromptModal), and the feedback widget.
 */
export function AppShell({ children }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <OfflineBanner />
        {children}
        <TransactionRecovery />
        <WalletMismatchBlocker />
        <FeedbackWidget />
      </AuthProvider>
    </ErrorBoundary>
  );
}
