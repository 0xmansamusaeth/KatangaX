import { decodeEventLog } from "viem";
import { KATANGA_VAULT_ABI } from "@/lib/web3/contracts";
import { basePublicClient } from "@/lib/web3/publicClient";
import { formatUsdc } from "@/lib/web3/utils";

const CACHE_PREFIX = "katangax:vault-events:";

/** @typedef {'contribution'|'payout'|'approval'|'round_advanced'} VaultEventType */

/**
 * @typedef {Object} VaultChainEvent
 * @property {string} id
 * @property {VaultEventType} type
 * @property {string} txHash
 * @property {bigint} blockNumber
 * @property {number} blockTimestamp
 * @property {number} round
 * @property {string} [member]
 * @property {string} [recipient]
 * @property {bigint} [amount]
 * @property {string} amountFormatted
 * @property {number} [approvalCount]
 * @property {string} title
 * @property {string} description
 */

function cacheKey(vaultAddress) {
  return `${CACHE_PREFIX}${vaultAddress.toLowerCase()}`;
}

function readCache(vaultAddress) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(cacheKey(vaultAddress));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      lastBlock: BigInt(parsed.lastBlock ?? 0),
      events: (parsed.events ?? []).map((e) => ({
        ...e,
        blockNumber: BigInt(e.blockNumber),
        amount: e.amount != null ? BigInt(e.amount) : undefined,
      })),
    };
  } catch {
    return null;
  }
}

function writeCache(vaultAddress, lastBlock, events) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      cacheKey(vaultAddress),
      JSON.stringify({
        lastBlock: lastBlock.toString(),
        events: events.map((e) => ({
          ...e,
          blockNumber: e.blockNumber.toString(),
          amount: e.amount != null ? e.amount.toString() : undefined,
        })),
      }),
    );
  } catch {
    /* quota */
  }
}

/**
 * @param {import('viem').Log} log
 * @param {Record<number, number>} blockTimestamps
 */
function parseLog(log, blockTimestamps) {
  let decoded;
  try {
    decoded = decodeEventLog({
      abi: KATANGA_VAULT_ABI,
      data: log.data,
      topics: log.topics,
    });
  } catch {
    return null;
  }

  const blockNumber = log.blockNumber ?? 0n;
  const blockTimestamp = blockTimestamps[Number(blockNumber)] ?? 0;
  const txHash = log.transactionHash ?? "";
  const base = {
    txHash,
    blockNumber,
    blockTimestamp,
  };

  switch (decoded.eventName) {
    case "ContributionMade": {
      const member = decoded.args.member;
      const round = Number(decoded.args.round);
      const amount = decoded.args.amount;
      return {
        ...base,
        id: `${txHash}-contribution-${log.logIndex}`,
        type: "contribution",
        round,
        member,
        amount,
        amountFormatted: formatUsdc(amount),
        title: "Contribution",
        description: `${truncateAddr(member)} contributed ${formatUsdc(amount)}`,
      };
    }
    case "PayoutDisbursed": {
      const recipient = decoded.args.recipient;
      const round = Number(decoded.args.round);
      const amount = decoded.args.amount;
      return {
        ...base,
        id: `${txHash}-payout-${log.logIndex}`,
        type: "payout",
        round,
        recipient,
        amount,
        amountFormatted: formatUsdc(amount),
        title: "Payout",
        description: `${truncateAddr(recipient)} received ${formatUsdc(amount)} payout`,
      };
    }
    case "DisbursementApproved": {
      const member = decoded.args.approver;
      const round = Number(decoded.args.round);
      const approvalCount = Number(decoded.args.approvalCount);
      return {
        ...base,
        id: `${txHash}-approval-${log.logIndex}`,
        type: "approval",
        round,
        member,
        approvalCount,
        amountFormatted: "",
        title: "Disbursement approval",
        description: `${truncateAddr(member)} approved Round ${round} disbursement (${approvalCount}/3)`,
      };
    }
    case "RoundAdvanced": {
      const round = Number(decoded.args.newRound);
      const recipient = decoded.args.nextRecipient;
      return {
        ...base,
        id: `${txHash}-round-${log.logIndex}`,
        type: "round_advanced",
        round,
        recipient,
        amountFormatted: "",
        title: "Round advanced",
        description: `Round ${round} started — ${truncateAddr(recipient)} is next`,
      };
    }
    default:
      return null;
  }
}

function truncateAddr(addr) {
  if (!addr || addr.length < 10) return addr ?? "Unknown";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/**
 * @param {string} vaultAddress
 * @param {{ force?: boolean }} [options]
 * @returns {Promise<VaultChainEvent[]>}
 */
export async function fetchVaultChainEvents(vaultAddress, options = {}) {
  const addr = vaultAddress;
  const cache = options.force ? null : readCache(addr);
  const latestBlock = await basePublicClient.getBlockNumber();
  const fromBlock =
    cache && cache.lastBlock > 0n ? cache.lastBlock + 1n : 0n;

  if (cache && fromBlock > latestBlock) {
    return cache.events;
  }

  const logs = await basePublicClient.getLogs({
    address: addr,
    fromBlock,
    toBlock: latestBlock,
  });

  const relevant = logs;

  const blockNums = new Set();
  for (const log of relevant) {
    if (log.blockNumber) blockNums.add(Number(log.blockNumber));
  }
  if (cache) {
    for (const e of cache.events) blockNums.add(Number(e.blockNumber));
  }

  /** @type {Record<number, number>} */
  const blockTimestamps = {};
  await Promise.all(
    [...blockNums].map(async (n) => {
      const block = await basePublicClient.getBlock({ blockNumber: BigInt(n) });
      blockTimestamps[n] = Number(block.timestamp);
    }),
  );

  const fresh = relevant
    .map((log) => parseLog(log, blockTimestamps))
    .filter(Boolean);

  const merged = [...(cache?.events ?? []), ...fresh];
  const byId = new Map();
  for (const e of merged) byId.set(e.id, e);
  const sorted = [...byId.values()].sort(
    (a, b) => b.blockTimestamp - a.blockTimestamp || Number(b.blockNumber - a.blockNumber),
  );

  writeCache(addr, latestBlock, sorted);
  return sorted;
}

/**
 * @param {VaultChainEvent[]} events
 * @param {string} walletAddress
 */
export function filterEventsForWallet(events, walletAddress) {
  const w = walletAddress.toLowerCase();
  return events.filter((e) => {
    if (e.type === "contribution" && e.member?.toLowerCase() === w) return true;
    if (e.type === "payout" && e.recipient?.toLowerCase() === w) return true;
    return false;
  });
}

/**
 * @param {VaultChainEvent[]} events
 * @param {{ id: string, name?: string, walletAddress?: string }[]} [members]
 */
export function enrichEventLabels(events, members = []) {
  const byWallet = new Map(
    members
      .filter((m) => m.walletAddress)
      .map((m) => [m.walletAddress.toLowerCase(), m.name ?? m.id]),
  );

  return events.map((e) => {
    const addr = (e.member ?? e.recipient)?.toLowerCase();
    const name = addr ? byWallet.get(addr) : null;
    if (!name) return e;

    if (e.type === "contribution") {
      return {
        ...e,
        description: `${name} contributed ${e.amountFormatted}`,
      };
    }
    if (e.type === "payout") {
      return {
        ...e,
        description: `${name} received ${e.amountFormatted} payout`,
      };
    }
    if (e.type === "approval") {
      return {
        ...e,
        description: `${name} approved Round ${e.round} disbursement (${e.approvalCount}/3)`,
      };
    }
    if (e.type === "round_advanced") {
      return {
        ...e,
        description: `Round ${e.round} started — ${name} is next`,
      };
    }
    return e;
  });
}
