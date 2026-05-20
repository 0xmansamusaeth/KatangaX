/** Normalize Zambian phone to E.164 (+260…) */
export function toE164(phone) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("260")) return `+${digits}`;
  if (digits.startsWith("0")) return `+260${digits.slice(1)}`;
  if (digits.length === 9) return `+260${digits}`;
  return phone.startsWith("+") ? phone : `+${digits}`;
}

export function formatDisplayPhone(e164) {
  if (!e164) return "";
  const d = e164.replace(/\D/g, "");
  if (d.length >= 12) {
    return `+260 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
  }
  return e164;
}
