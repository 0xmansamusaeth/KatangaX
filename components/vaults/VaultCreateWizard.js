"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Minus,
  Pencil,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { StepIndicator } from "@/components/vaults/StepIndicator";
import {
  MemberChip,
  MemberPicker,
} from "@/components/vaults/MemberPicker";
import { useUser } from "@/hooks/useUser";
import { useVaults } from "@/hooks/useVaults";
import { ConnectWalletInline } from "@/components/web3/ConnectWalletButton";
import { TransactionStatus } from "@/components/web3/TransactionStatus";
import { useCreateVault } from "@/lib/web3/hooks/useCreateVault";
import { useUSDCBalance } from "@/lib/web3/hooks/useUSDCBalance";
import { useWalletConnection } from "@/lib/web3/hooks/useWalletConnection";
import {
  buildOnChainMemberAddresses,
  frequencyToRoundDays,
  parseUsdc,
  truncateAddress,
} from "@/lib/web3/utils";
import {
  formatCurrency,
  formatDate,
  getInitials,
  getPeriodLabel,
  todayIsoDate,
} from "@/lib/utils";

const STEPS = [
  { id: 0, label: "Details" },
  { id: 1, label: "Members" },
  { id: 2, label: "Review" },
];

const FREQUENCY_OPTIONS = [
  { value: "week", label: "Weekly" },
  { value: "biweek", label: "Bi-weekly" },
  { value: "month", label: "Monthly" },
];

const PAYMENT_METHODS = [
  {
    value: "mobile_money",
    emoji: "💳",
    label: "Mobile Money",
    description: "MTN, Airtel Money",
  },
  {
    value: "usdc",
    emoji: "🔷",
    label: "USDC on Base",
    description: "Pay with your Base wallet",
  },
];

const PAYOUT_METHODS = [
  {
    value: "random",
    emoji: "🎲",
    label: "Random Draw",
    description: "Order picked by lottery at start",
  },
  {
    value: "fixed",
    emoji: "📋",
    label: "Fixed Order",
    description: "You set who receives when",
  },
  {
    value: "bidding",
    emoji: "🏷️",
    label: "Bidding",
    description: "Members bid to receive early",
  },
];

const DESCRIPTION_LIMIT = 200;
const NAME_MIN = 3;
const NAME_MAX = 40;
const AMOUNT_MIN = 10;
const MEMBERS_MIN = 2;
const MEMBERS_MAX = 20;

/**
 * Per-field validation. Returns an object keyed by field name whose
 * values are error strings (empty string == OK). Caller decides which
 * fields are "touched" and shows the matching message.
 *
 * @param {{name: string, amount: string|number, memberCount: number, startDate: string, description: string}} form
 * @param {string} today YYYY-MM-DD; if empty (pre-hydration) the date
 *                       check is skipped.
 */
function getFieldErrors(form, today) {
  const errs = { name: "", amount: "", memberCount: "", startDate: "", description: "" };

  const trimmed = (form.name ?? "").trim();
  if (!trimmed) errs.name = "Vault name is required.";
  else if (trimmed.length < NAME_MIN)
    errs.name = `Use at least ${NAME_MIN} characters.`;
  else if (trimmed.length > NAME_MAX)
    errs.name = `Keep it under ${NAME_MAX} characters.`;

  const amt = Number(form.amount);
  if (form.amount === "" || form.amount === null || form.amount === undefined)
    errs.amount = "Contribution amount is required.";
  else if (!Number.isFinite(amt) || amt <= 0)
    errs.amount = "Enter a valid amount.";
  else if (amt < AMOUNT_MIN)
    errs.amount = `Minimum contribution is ZMW ${AMOUNT_MIN}.`;

  const m = Number(form.memberCount);
  if (!Number.isFinite(m) || m < MEMBERS_MIN || m > MEMBERS_MAX)
    errs.memberCount = `Choose between ${MEMBERS_MIN} and ${MEMBERS_MAX} members.`;

  if (!form.startDate) errs.startDate = "Pick a start date.";
  else if (today && form.startDate < today)
    errs.startDate = "Start date can’t be in the past.";

  if ((form.description ?? "").length > DESCRIPTION_LIMIT)
    errs.description = `Keep rules under ${DESCRIPTION_LIMIT} characters.`;

  return errs;
}

export function VaultCreateWizard() {
  const router = useRouter();
  const { user } = useUser();
  const { addVault } = useVaults();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    frequency: "month",
    memberCount: 10,
    paymentMethod: "mobile_money",
    payoutMethod: "random",
    // Initialized client-side in the effect below to avoid SSR/CSR
    // timezone drift on `todayIsoDate()`.
    startDate: "",
    description: "",
  });
  const [addedMembers, setAddedMembers] = useState(/** @type {any[]} */ ([]));
  const [agreed, setAgreed] = useState(false);
  const [showMismatch, setShowMismatch] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState("");
  const [pendingDeploy, setPendingDeploy] = useState(null);

  const { address, isConnected, isBase } = useWalletConnection();
  const { formatted: usdcBalance, balance: usdcBalanceRaw } = useUSDCBalance();
  const {
    createVault: deployVault,
    status: deployStatus,
    txHash: deployTxHash,
    error: deployError,
    isSuccess: deploySuccess,
    resolveVaultFromReceipt,
  } = useCreateVault();
  const [today, setToday] = useState("");
  const [touched, setTouched] = useState({
    name: false,
    amount: false,
    memberCount: false,
    startDate: false,
    description: false,
  });

  useEffect(() => {
    const t = todayIsoDate();
    setToday(t);
    setForm((f) => (f.startDate ? f : { ...f, startDate: t }));
  }, []);

  const errors = useMemo(() => getFieldErrors(form, today), [form, today]);

  const markTouched = (field) =>
    setTouched((t) => (t[field] ? t : { ...t, [field]: true }));

  const step1Valid = useMemo(
    () =>
      !!form.payoutMethod &&
      !errors.name &&
      !errors.amount &&
      !errors.memberCount &&
      !errors.startDate &&
      !errors.description,
    [form.payoutMethod, errors],
  );

  const expectedInvites = Math.max(0, form.memberCount - 1);
  const matchesCount = addedMembers.length === expectedInvites;

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const decMembers = () =>
    update({ memberCount: Math.max(2, Number(form.memberCount) - 1) });
  const incMembers = () =>
    update({ memberCount: Math.min(20, Number(form.memberCount) + 1) });

  const onAddMember = (m) => {
    setAddedMembers((prev) => {
      if (prev.some((p) => p.id === m.id)) return prev;
      if (prev.length >= expectedInvites) {
        toast(`You only need ${expectedInvites} more invitees`, {
          variant: "info",
        });
        return prev;
      }
      return [...prev, m];
    });
  };

  const onRemoveMember = (id) =>
    setAddedMembers((prev) => prev.filter((m) => m.id !== id));

  const handleNext = () => {
    if (step === 0) {
      if (!step1Valid) {
        // Force every field to surface its error so the user can see what
        // to fix even if they never blurred it.
        setTouched({
          name: true,
          amount: true,
          memberCount: true,
          startDate: true,
          description: true,
        });
        toast("Please fix the highlighted fields", { variant: "error" });
        return;
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      if (addedMembers.length === 0) {
        toast("Add at least one member to continue", { variant: "error" });
        return;
      }
      if (!matchesCount) {
        setShowMismatch(true);
        return;
      }
      setStep(2);
    }
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const finishLocalVault = (id, contractAddress, memberWallets) => {
    const amount = Number(form.amount);
    const memberCount = form.memberCount;

    const creator = {
      id: `${id}-u1`,
      userId: user.id,
      name: user.name,
      initials: getInitials(user.name),
      avatarColor: user.avatarColor ?? "#1B5E20",
      phone: user.phone,
      payoutOrder: 1,
      agreementAccepted: true,
      walletAddress: memberWallets?.[0],
    };

    const invitedMembers = addedMembers.map((m, idx) => ({
      id: m.id,
      name: m.name,
      initials: m.initials,
      avatarColor: m.avatarColor,
      phone: m.phone,
      payoutOrder: idx + 2,
      agreementAccepted: false,
      walletAddress: memberWallets?.[idx + 1],
    }));

    const members = [creator, ...invitedMembers];
    while (members.length < memberCount) {
      const order = members.length + 1;
      members.push({
        id: `${id}-pad-${order}`,
        name: `Member ${order}`,
        initials: "M",
        avatarColor: "#6B7280",
        payoutOrder: order,
        agreementAccepted: false,
        walletAddress: memberWallets?.[order - 1],
      });
    }

    const paymentStatusesByRound = {
      1: Object.fromEntries(members.map((m) => [m.id, "pending"])),
    };

    addVault({
      id,
      name: form.name.trim(),
      description: form.description.trim(),
      memberCount,
      contributionAmount: amount,
      contributionPeriod: form.frequency,
      paymentMethod: form.paymentMethod,
      contractAddress: contractAddress || undefined,
      currentRound: 1,
      totalRounds: memberCount,
      status: "active",
      startDate: form.startDate,
      payoutOrderMethod: form.payoutMethod,
      createdBy: user.name,
      organiserId: creator.id,
      payoutRecipientMemberId: creator.id,
      members,
      contributionHistory: [],
      paymentStatusesByRound,
    });

    if (contractAddress) {
      toast(`Vault deployed! Contract: ${truncateAddress(contractAddress)}`, {
        variant: "success",
      });
    } else {
      toast("Vault created! Invites sent to members.");
    }
    router.push(`/vaults/${id}`);
  };

  const submit = async () => {
    if (!agreed) {
      toast("Please accept the Vault Terms to continue", { variant: "error" });
      return;
    }

    const id = `vault-${Date.now()}`;

    if (form.paymentMethod === "usdc") {
      if (!isConnected || !isBase || !address) {
        toast("Connect your Base wallet first", { variant: "error" });
        return;
      }
      if (form.memberCount < 3) {
        toast("On-chain vaults need at least 3 members", { variant: "error" });
        return;
      }
      const amountAtomic = parseUsdc(form.amount);
      if (usdcBalanceRaw != null && usdcBalanceRaw < amountAtomic) {
        toast("Insufficient USDC balance for this vault", { variant: "error" });
        return;
      }

      const memberWallets = buildOnChainMemberAddresses(
        address,
        addedMembers,
        form.memberCount,
      );

      setDeploying(true);
      setPendingDeploy({ id, memberWallets });
      try {
        await deployVault({
          vaultName: form.name.trim(),
          members: memberWallets,
          contributionAmount: amountAtomic,
          roundDurationDays: frequencyToRoundDays(form.frequency),
        });
      } catch {
        setPendingDeploy(null);
        setDeploying(false);
        toast(deployError ?? "Vault deployment failed", { variant: "error" });
      }
      return;
    }

    finishLocalVault(id, undefined, undefined);
  };

  useEffect(() => {
    if (!deploySuccess || !pendingDeploy) return;
    const contractAddress = resolveVaultFromReceipt();
    if (!contractAddress) return;
    setDeployedAddress(contractAddress);
    finishLocalVault(
      pendingDeploy.id,
      contractAddress,
      pendingDeploy.memberWallets,
    );
    setPendingDeploy(null);
    setDeploying(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- finishLocalVault closes over form state
  }, [deploySuccess, pendingDeploy, resolveVaultFromReceipt]);

  return (
    <div className="space-y-5">
      <StepIndicator steps={STEPS} currentStep={step} />

      {step === 0 ? (
        <StepDetails
          form={form}
          today={today}
          onChange={update}
          decMembers={decMembers}
          incMembers={incMembers}
          errors={errors}
          touched={touched}
          onBlur={markTouched}
          isConnected={isConnected}
          isBase={isBase}
          walletAddress={address}
          usdcBalance={usdcBalance}
          usdcBalanceRaw={usdcBalanceRaw}
        />
      ) : null}

      {step === 1 ? (
        <StepMembers
          form={form}
          addedMembers={addedMembers}
          onAdd={onAddMember}
          onRemove={onRemoveMember}
          showMismatch={showMismatch}
          onProceedAnyway={() => {
            setShowMismatch(false);
            setStep(2);
          }}
          onDismissMismatch={() => setShowMismatch(false)}
          expectedInvites={expectedInvites}
          user={user}
        />
      ) : null}

      {step === 2 ? (
        <StepReview
          form={form}
          addedMembers={addedMembers}
          user={user}
          agreed={agreed}
          onAgreed={setAgreed}
          onEditStep={setStep}
          deploying={deploying}
          deployStatus={deployStatus}
          deployTxHash={deployTxHash}
          deployedAddress={deployedAddress}
        />
      ) : null}

      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          className="flex-1 gap-1"
          onClick={handleBack}
          disabled={step === 0}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        {step < 2 ? (
          <Button
            type="button"
            className="flex-1 gap-1"
            onClick={handleNext}
            disabled={step === 0 ? !step1Valid : false}
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            className="flex-1 gap-1"
            onClick={submit}
            disabled={!agreed || deploying}
          >
            <CheckCircle2 className="h-4 w-4" />
            {deploying ? "Deploying…" : "Create Vault"}
          </Button>
        )}
      </div>
    </div>
  );
}

function StepDetails({
  form,
  today,
  onChange,
  decMembers,
  incMembers,
  errors,
  touched,
  onBlur,
  isConnected,
  isBase,
  walletAddress,
  usdcBalance,
  usdcBalanceRaw,
}) {
  const showErr = (field) => touched[field] && errors[field];

  return (
    <div className="space-y-5">
      <FieldShell>
        <Label htmlFor="vault-name">Vault Name</Label>
        <Input
          id="vault-name"
          value={form.name}
          onChange={(e) => onChange({ name: e.target.value })}
          onBlur={() => onBlur("name")}
          placeholder="e.g. Garden Collective"
          maxLength={NAME_MAX + 8}
          aria-invalid={Boolean(showErr("name"))}
          aria-describedby={showErr("name") ? "vault-name-err" : undefined}
        />
        {showErr("name") ? (
          <FieldError id="vault-name-err">{errors.name}</FieldError>
        ) : null}
      </FieldShell>

      <FieldShell>
        <Label>Payment Method</Label>
        <div className="space-y-2">
          {PAYMENT_METHODS.map((opt) => {
            const active = form.paymentMethod === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ paymentMethod: opt.value })}
                className={
                  "flex w-full items-start gap-3 rounded-xl border-2 bg-white p-3 text-left transition-colors " +
                  (active
                    ? "border-[#1B5E20] bg-[#1B5E20]/[0.03]"
                    : "border-border")
                }
              >
                <span className="text-xl leading-none">{opt.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1A1A1A]">
                    {opt.label}
                  </p>
                  <p className="text-xs text-[#6B7280]">{opt.description}</p>
                </div>
                <span
                  className={
                    "mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 " +
                    (active
                      ? "border-[#1B5E20] bg-[#1B5E20]"
                      : "border-[#D1D5DB] bg-white")
                  }
                >
                  {active ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
        {form.paymentMethod === "usdc" && !isConnected ? (
          <div className="rounded-xl border border-[#FFC107]/50 bg-[#FFFBEB] p-3 text-sm text-[#92400E]">
            Connect your Base wallet to use USDC.
            <ConnectWalletInline />
          </div>
        ) : null}
        {form.paymentMethod === "usdc" && isConnected && isBase ? (
          <div className="rounded-xl border border-[#16A34A]/30 bg-[#16A34A]/10 p-3 text-sm text-[#166534]">
            <p className="font-mono text-xs">{truncateAddress(walletAddress)}</p>
            <p className="mt-1 font-semibold">{usdcBalance}</p>
            {usdcBalanceRaw != null &&
            parseUsdc(form.amount || "0") > usdcBalanceRaw ? (
              <p className="mt-2 text-xs text-[#DC2626]">
                Insufficient USDC balance for this vault
              </p>
            ) : null}
          </div>
        ) : null}
      </FieldShell>

      <FieldShell>
        <Label htmlFor="vault-amount">Contribution Amount</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#1B5E20]">
            {form.paymentMethod === "usdc" ? "USDC" : "ZMW"}
          </span>
          <Input
            id="vault-amount"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => onChange({ amount: e.target.value })}
            onBlur={() => onBlur("amount")}
            placeholder="500"
            className="pl-14"
            aria-invalid={Boolean(showErr("amount"))}
            aria-describedby={showErr("amount") ? "vault-amount-err" : undefined}
          />
        </div>
        {showErr("amount") ? (
          <FieldError id="vault-amount-err">{errors.amount}</FieldError>
        ) : null}
      </FieldShell>

      <FieldShell>
        <Label>Frequency</Label>
        <SegmentedControl
          value={form.frequency}
          onChange={(v) => onChange({ frequency: v })}
          options={FREQUENCY_OPTIONS}
        />
      </FieldShell>

      <FieldShell>
        <Label>Number of Members</Label>
        <div className="flex items-center justify-between rounded-xl border border-border bg-white p-1.5">
          <button
            type="button"
            onClick={() => {
              decMembers();
              onBlur("memberCount");
            }}
            aria-label="Decrease members"
            disabled={form.memberCount <= MEMBERS_MIN}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F5F7F5] text-[#1A1A1A] transition-colors hover:bg-[#E5E7EB] disabled:opacity-40 active:scale-95"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="text-center">
            <p className="text-xl font-semibold leading-tight text-[#1A1A1A]">
              {form.memberCount}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-[#6B7280]">
              members
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              incMembers();
              onBlur("memberCount");
            }}
            aria-label="Increase members"
            disabled={form.memberCount >= MEMBERS_MAX}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1B5E20] text-white transition-colors hover:bg-[#145214] disabled:opacity-40 active:scale-95"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {showErr("memberCount") ? (
          <FieldError>{errors.memberCount}</FieldError>
        ) : (
          <p className="text-[11px] text-[#6B7280]">
            {MEMBERS_MIN} – {MEMBERS_MAX} members
          </p>
        )}
      </FieldShell>

      <FieldShell>
        <Label>Payout Order</Label>
        <div className="space-y-2">
          {PAYOUT_METHODS.map((opt) => {
            const active = form.payoutMethod === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ payoutMethod: opt.value })}
                className={
                  "flex w-full items-start gap-3 rounded-xl border-2 bg-white p-3 text-left transition-colors " +
                  (active
                    ? "border-[#1B5E20] bg-[#1B5E20]/[0.03]"
                    : "border-border")
                }
              >
                <span className="text-xl leading-none">{opt.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1A1A1A]">
                    {opt.label}
                  </p>
                  <p className="text-xs text-[#6B7280]">{opt.description}</p>
                </div>
                <span
                  className={
                    "mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 " +
                    (active
                      ? "border-[#1B5E20] bg-[#1B5E20]"
                      : "border-[#D1D5DB] bg-white")
                  }
                >
                  {active ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </FieldShell>

      <FieldShell>
        <Label htmlFor="vault-start">Start Date</Label>
        <Input
          id="vault-start"
          type="date"
          min={today}
          value={form.startDate}
          onChange={(e) => onChange({ startDate: e.target.value })}
          onBlur={() => onBlur("startDate")}
          aria-invalid={Boolean(showErr("startDate"))}
          aria-describedby={showErr("startDate") ? "vault-start-err" : undefined}
        />
        {showErr("startDate") ? (
          <FieldError id="vault-start-err">{errors.startDate}</FieldError>
        ) : null}
      </FieldShell>

      <FieldShell>
        <Label htmlFor="vault-desc">Vault Rules / Description</Label>
        <Textarea
          id="vault-desc"
          value={form.description}
          onChange={(e) =>
            onChange({
              description: e.target.value.slice(0, DESCRIPTION_LIMIT),
            })
          }
          onBlur={() => onBlur("description")}
          placeholder="Late fees, payout day, expectations…"
          rows={4}
        />
        <div className="flex items-center justify-between">
          {showErr("description") ? (
            <FieldError>{errors.description}</FieldError>
          ) : (
            <span />
          )}
          <p className="text-[11px] text-[#6B7280]">
            {form.description.length} / {DESCRIPTION_LIMIT}
          </p>
        </div>
      </FieldShell>
    </div>
  );
}

function FieldError({ id, children }) {
  return (
    <p id={id} role="alert" className="text-[11px] font-medium text-[#DC2626]">
      {children}
    </p>
  );
}

function StepMembers({
  form,
  addedMembers,
  onAdd,
  onRemove,
  showMismatch,
  onProceedAnyway,
  onDismissMismatch,
  expectedInvites,
  user,
}) {
  const youChip = {
    id: "you",
    name: `${user.name.split(" ")[0]} (You)`,
    initials: getInitials(user.name),
    avatarColor: user.avatarColor ?? "#1B5E20",
    locked: true,
  };

  const totalAdded = addedMembers.length + 1;

  return (
    <div className="space-y-5">
      <FieldShell>
        <div className="flex items-center justify-between">
          <Label>Members</Label>
          <span
            className={
              "text-xs font-semibold " +
              (totalAdded === form.memberCount
                ? "text-[#16A34A]"
                : "text-[#6B7280]")
            }
          >
            {totalAdded} / {form.memberCount} members added
          </span>
        </div>
        <p className="text-xs text-[#6B7280]">
          You are already counted. Invite {expectedInvites} more.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <MemberChip member={youChip} />
          {addedMembers.map((m) => (
            <MemberChip key={m.id} member={m} onRemove={onRemove} />
          ))}
        </div>
      </FieldShell>

      <FieldShell>
        <Label>Suggested</Label>
        <MemberPicker
          addedIds={addedMembers.map((m) => m.id)}
          onAdd={onAdd}
          onRemove={onRemove}
        />
      </FieldShell>

      {showMismatch ? (
        <div className="rounded-xl border border-[#FFC107] bg-[#FFFBEB] p-3 text-sm text-[#92400E]">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1 space-y-2">
              <p>
                You have {addedMembers.length} of {expectedInvites} invitees.
                The vault expects {form.memberCount} members. You can adjust
                later, but proceed only if that is intentional.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDismissMismatch}
                  type="button"
                >
                  Keep editing
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  onClick={onProceedAnyway}
                  type="button"
                >
                  Continue anyway
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StepReview({
  form,
  addedMembers,
  user,
  agreed,
  onAgreed,
  onEditStep,
  deploying,
  deployStatus,
  deployTxHash,
  deployedAddress,
}) {
  const youChip = {
    id: "you",
    name: `${user.name.split(" ")[0]} (You)`,
    initials: getInitials(user.name),
    avatarColor: user.avatarColor ?? "#1B5E20",
    locked: true,
  };
  const allMembers = [youChip, ...addedMembers];
  const pretty = PAYOUT_METHODS.find((p) => p.value === form.payoutMethod);
  const payment = PAYMENT_METHODS.find((p) => p.value === form.paymentMethod);

  return (
    <div className="space-y-4">
      {deploying || deployStatus === "pending" ? (
        <div className="space-y-3 rounded-xl border border-border bg-white p-4">
          <p className="text-sm font-semibold text-[#1A1A1A]">
            Deploying vault contract…
          </p>
          <p className="text-xs text-[#6B7280]">
            Waiting for confirmation on Base…
          </p>
          <TransactionStatus
            status={deployStatus}
            txHash={deployTxHash}
            message="Deploying vault contract on Base…"
          />
        </div>
      ) : null}
      {deployedAddress ? (
        <p className="rounded-xl bg-[#16A34A]/10 p-3 text-sm text-[#166534]">
          Vault deployed! Contract: {truncateAddress(deployedAddress)}
        </p>
      ) : null}

      <SummaryCard
        title="Vault details"
        onEdit={() => onEditStep(0)}
      >
        <SummaryRow label="Name" value={form.name || "—"} />
        <SummaryRow
          label="Payment"
          value={`${payment?.emoji ?? ""} ${payment?.label ?? form.paymentMethod}`}
        />
        <SummaryRow
          label="Contribution"
          value={
            form.paymentMethod === "usdc"
              ? `${form.amount || 0} USDC · ${getPeriodLabel(form.frequency)}`
              : `${formatCurrency(Number(form.amount) || 0)} · ${getPeriodLabel(form.frequency)}`
          }
        />
        <SummaryRow
          label="Members"
          value={`${form.memberCount}`}
        />
        <SummaryRow
          label="Payout order"
          value={`${pretty?.emoji ?? ""} ${pretty?.label ?? form.payoutMethod}`}
        />
        <SummaryRow
          label="Start date"
          value={formatDate(form.startDate, {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        />
        {form.description ? (
          <SummaryRow label="Rules" value={form.description} multiline />
        ) : null}
      </SummaryCard>

      <SummaryCard
        title={`Members (${allMembers.length})`}
        onEdit={() => onEditStep(1)}
      >
        <div className="flex flex-wrap gap-2 pt-1">
          {allMembers.map((m) => (
            <MemberChip key={m.id} member={m} />
          ))}
        </div>
      </SummaryCard>

      <label
        className="flex items-start gap-3 rounded-xl border border-border bg-white p-3"
        htmlFor="agree-terms"
      >
        <Checkbox
          id="agree-terms"
          checked={agreed}
          onCheckedChange={onAgreed}
        />
        <span className="text-sm leading-snug text-[#1A1A1A]">
          I agree to the{" "}
          <span className="font-semibold text-[#1B5E20]">
            KatangaX Vault Terms
          </span>
          .
        </span>
      </label>
    </div>
  );
}

function FieldShell({ children }) {
  return <div className="space-y-2">{children}</div>;
}

function SummaryCard({ title, onEdit, children }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">{title}</h3>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${title}`}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#1B5E20] transition-colors hover:bg-[#F5F7F5]"
          >
            <Pencil className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value, multiline }) {
  return (
    <div
      className={
        multiline
          ? "flex flex-col gap-1"
          : "flex items-baseline justify-between gap-3 text-sm"
      }
    >
      <span className="text-xs uppercase tracking-wide text-[#6B7280]">
        {label}
      </span>
      <span
        className={
          multiline
            ? "text-sm text-[#1A1A1A]"
            : "max-w-[60%] text-right text-sm font-medium text-[#1A1A1A]"
        }
      >
        {value}
      </span>
    </div>
  );
}

