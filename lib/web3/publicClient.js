import { createPublicClient, http } from "viem";
import { baseMainnet } from "@/lib/web3/chains";

export const basePublicClient = createPublicClient({
  chain: baseMainnet,
  transport: http(baseMainnet.rpcUrls.default.http[0]),
});
