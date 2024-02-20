import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
} from '@web3modal/ethereum';
import { Web3Modal } from '@web3modal/html';
import {
  Chain,
  WalletClient,
  configureChains,
  createConfig,
  getWalletClient,
} from '@wagmi/core';
import {
  HttpTransport,
  PublicClient,
  WalletClient as WalletClientV,
  createPublicClient,
  http,
  isAddress,
} from 'viem';
import {
  ALCHEMY_URL,
  CHAINS,
  INFURA_URL,
  PROJECT_ID,
} from 'src/scripts/config';
import { FallbackProvider, JsonRpcProvider, Provider, ethers } from 'ethers';

const chains: Chain[] = CHAINS;
const projectId = PROJECT_ID;
const connectors = w3mConnectors({ projectId, version: 2, chains });

const { publicClient: publicClientBuilder } = configureChains(chains, [
  w3mProvider({ projectId }),
]);
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: connectors,
  publicClient: publicClientBuilder,
});
const ethereumClient = new EthereumClient(wagmiConfig, chains);
const web3modal = new Web3Modal(
  {
    projectId,
    themeMode: 'dark',
    defaultChain: chains[0],
    themeVariables: {
      '--w3m-accent-color': '#F0AC4A',
    }
  },
  ethereumClient
);

export function getWeb3Modal(): Web3Modal {
  return web3modal;
}

let publicClient: PublicClient;

export function getPublicClient(): PublicClient {
  if (!publicClient || publicClient.chain?.id !== wagmiConfig.lastUsedChainId) {
    publicClient = createPublicClient({
      chain: chains.find((chain) => chain.id === wagmiConfig.lastUsedChainId),
      transport: http(INFURA_URL),
    });
  }
  return publicClient;
}

let alchemyClient: PublicClient;

export function getAlchemyClient(): PublicClient {
  if (
    !alchemyClient ||
    alchemyClient.chain?.id !== wagmiConfig.lastUsedChainId
  ) {
    alchemyClient = createPublicClient({
      chain: chains.find((chain) => chain.id === wagmiConfig.lastUsedChainId),
      transport: http(ALCHEMY_URL),
    });
  }

  return alchemyClient;
}

function usingChain(chainId: number): boolean {
  return chains.map((chain) => chain.id).includes(chainId);
}

export async function getConnectedWalletClient(): Promise<
  WalletClient | WalletClientV
> {
  return (await getWalletClient()) ?? (await connectors[1].getWalletClient());
}

export async function trySwitchChain(): Promise<boolean> {
  const walletClient = await getConnectedWalletClient();
  if (!walletClient) return false;
  if (!usingChain(await walletClient.getChainId())) {
    await walletClient.switchChain(chains[0]).catch(() => false);
    return usingChain(await walletClient.getChainId());
  }
  return true;
}

export function registerRefreshFunction(refresh: () => Promise<void>) {
  getWeb3Modal().subscribeEvents(() => {
    refresh();
  });
  getWeb3Modal().subscribeModal(() => {
    refresh();
  });
}

// helpers
export async function getAddressBalance(address: string): Promise<bigint> {
  if (!isAddress(address)) {
    throw new Error(`Invalid address: ${address}`);
  }

  return getPublicClient().getBalance({
    address: address as `0x${string}`,
  });
}
