import { ETHERSCAN } from './config';

export function getExplorer(): string {
  return ETHERSCAN;
}

export function getExplorerTx(tx: string): string {
  return `${getExplorer()}/tx/${tx}`;
}

export function getExplorerAddress(address: string): string {
  return `${getExplorer()}/address/${address}`;
}

export function getExplorerToken(token: string): string {
  return `${getExplorer()}/token/${token}`;
}

export function getExplorerBlock(block: string): string {
  return `${getExplorer()}/block/${block}`;
}

export function getExplorerTxs(address: string): string {
  return `${getExplorer()}/txs?a=${address}`;
}
