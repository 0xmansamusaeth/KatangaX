"use client";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { TransactionRecovery } from "@/components/web3/TransactionRecovery";
import { WalletMismatchBlocker } from "@/components/web3/WalletMismatchBlocker";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";

/**
 * Client-side shell: keeps the root layout server-rendered while wrapping
 * the tree in an error boundary, global banners, and the feedback widget.
 */
export function AppShell({ children }) {
  return (
    <ErrorBoundary>
      <OfflineBanner />
      {children}
      <TransactionRecovery />
      <WalletMismatchBlocker />
      <FeedbackWidget />
    </ErrorBoundary>
  );
}
