"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { baseMainnet } from "@/lib/web3/chains";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "katangax-demo";

/** Base mainnet — chainId 8453 */
export { baseMainnet };

export const wagmiConfig = getDefaultConfig({
  appName: "KatangaX",
  projectId,
  chains: [baseMainnet],
  wallets: [
    {
      groupName: "Recommended",
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
        walletConnectWallet,
        rainbowWallet,
      ],
    },
  ],
  ssr: true,
});
