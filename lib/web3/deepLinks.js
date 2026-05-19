/**
 * @param {string} [path]
 */
export function getAppUrl(path = "") {
  if (typeof window === "undefined") {
    return `https://katangax.app${path}`;
  }
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}${path}`;
}

export function isMobileBrowser() {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export function hasInjectedWallet() {
  if (typeof window === "undefined") return false;
  return Boolean(window.ethereum);
}

/**
 * @param {string} [currentUrl]
 */
export function getMobileWalletLinks(currentUrl) {
  const pageUrl = currentUrl ?? getAppUrl();
  const encoded = encodeURIComponent(pageUrl);
  const dappPath = pageUrl.replace(/^https?:\/\//, "");

  return [
    {
      id: "coinbase",
      label: "Open in Coinbase Wallet",
      href: `https://go.cb-wallet.io/wsegue?url=${encoded}`,
    },
    {
      id: "metamask",
      label: "Open in MetaMask",
      href: `https://metamask.app.link/dapp/${dappPath}`,
    },
    {
      id: "rainbow",
      label: "Open in Rainbow",
      href: `https://rnbwapp.com/wc?uri=${encoded}`,
    },
  ];
}
