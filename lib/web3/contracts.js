import katangaVaultAbi from "@/lib/web3/abis/katangaVault.json";
import katangaFactoryAbi from "@/lib/web3/abis/katangaFactory.json";

export const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS;
export const USDC_ADDRESS =
  process.env.NEXT_PUBLIC_USDC_ADDRESS ??
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export const USDC_DECIMALS = 6;

/** Minimal ERC20 for balance, approve, allowance */
export const USDC_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
];

export const KATANGA_VAULT_ABI = katangaVaultAbi;
export const KATANGA_FACTORY_ABI = katangaFactoryAbi;

export const BASE_CHAIN_ID = 8453;
export const MIN_DISBURSEMENT_APPROVALS = 3;
