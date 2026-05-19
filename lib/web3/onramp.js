/**
 * Coinbase Pay onramp URL (USDC on Base, prefilled wallet).
 * @param {string} walletAddress
 */
export function getCoinbaseOnrampUrl(walletAddress) {
  const addresses = JSON.stringify({
    [walletAddress]: ["base"],
  });
  const params = new URLSearchParams({
    defaultAsset: "USDC",
    defaultNetwork: "base",
    presetCryptoAmount: "20",
    addresses,
  });
  return `https://pay.coinbase.com/buy/select-asset?${params.toString()}`;
}

export const BASE_BRIDGE_URL = "https://bridge.base.org";
