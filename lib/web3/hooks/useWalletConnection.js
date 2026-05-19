"use client";

import { useAccount, useChainId, useDisconnect, useSwitchChain } from "wagmi";
import { BASE_CHAIN_ID } from "@/lib/web3/contracts";

export function useWalletConnection() {
  const { address, isConnected, isConnecting, isReconnecting, connector } =
    useAccount();
  const chainId = useChainId();
  const { disconnect, isPending: isDisconnecting } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const isBase = chainId === BASE_CHAIN_ID;

  const switchToBase = () => {
    if (switchChain) {
      switchChain({ chainId: BASE_CHAIN_ID });
    }
  };

  return {
    address,
    isConnected,
    isConnecting: isConnecting || isReconnecting,
    isDisconnecting,
    isSwitching,
    chainId,
    isBase,
    connector,
    disconnect,
    switchToBase,
  };
}
