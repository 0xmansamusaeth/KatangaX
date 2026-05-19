const KEYS = {
  onboardingSeen: "katangax:web3-onboarding-seen",
  signatureExplainerDismissed: "katangax:signature-explainer-dismissed",
  adminChecks: "katangax:admin-checks",
};

export function hasSeenWeb3Onboarding() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(KEYS.onboardingSeen) === "1";
}

export function markWeb3OnboardingSeen() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEYS.onboardingSeen, "1");
}

export function hasDismissedSignatureExplainer() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEYS.signatureExplainerDismissed) === "1";
}

export function dismissSignatureExplainer() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEYS.signatureExplainerDismissed, "1");
}

export function getAdminChecks() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEYS.adminChecks) ?? "{}");
  } catch {
    return {};
  }
}

export function setAdminCheck(id, checked) {
  if (typeof window === "undefined") return;
  const prev = getAdminChecks();
  window.localStorage.setItem(
    KEYS.adminChecks,
    JSON.stringify({ ...prev, [id]: checked }),
  );
}
