/** @returns {Promise<number|null>} ETH price in USD */
export async function fetchEthUsdPrice() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.ethereum?.usd ?? null;
  } catch {
    return null;
  }
}

/**
 * @param {bigint} gasWei
 * @param {number|null} ethUsd
 */
export function formatGasEstimate(gasWei, ethUsd) {
  const eth = Number(gasWei) / 1e18;
  const usd = ethUsd != null ? eth * ethUsd : null;
  return {
    gasWei,
    eth,
    ethLabel: eth < 0.0001 ? eth.toExponential(2) : eth.toFixed(6),
    usd,
    usdLabel: usd != null ? (usd < 0.01 ? "<$0.01" : `~$${usd.toFixed(2)}`) : "~$0.01",
  };
}

/** Rough L1-style buffer for Base (gas price * limit) */
/** ~0.00005 ETH minimum buffer for gas on Base */
export const MIN_ETH_FOR_GAS = 50_000_000_000_000n;
