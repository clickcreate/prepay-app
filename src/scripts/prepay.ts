import { getAccount, readContract, writeContract } from '@wagmi/core';
import { PREPAY_ABI, PREPAY_ADDRESS, PREPAY_DEPLOY_BLOCK } from './prepay.abi';
import {
  PASS_ABI,
  PASS_ADDRESS,
  PASS_DEPLOY_BLOCK,
  PASS_TOKEN_ID,
} from './pass.abi';
import { getAlchemyClient, getConnectedWalletClient } from './wallet';
import { Block, isAddress, parseAbiItem } from 'viem';
import { WriteContractResult } from '@wagmi/core';

export interface PrepayInfo {
  balance: bigint;
  hasPass: boolean;
  beneficiary: string;
  price: bigint;
  prepayMinMints: bigint;
  owner: string;
  passesOwned: bigint;
}

export interface PrepayCreatedEvent {
  prepayUser: string;
  prepayAmount: bigint;
  passContract: string;
  passTokenId: bigint;
  prepayPrice: bigint;
  timestamp: bigint;
}

export interface MintDoneEvent {
  timestamp: bigint;
}

export async function getAddressInfo(address: string): Promise<PrepayInfo> {
  if (!address) {
    address = '0x0000000000000000000000000000abc000012121';
  }

  const data = (await getAlchemyClient().readContract({
    address: PREPAY_ADDRESS,
    abi: PREPAY_ABI,
    functionName: 'getInfo',
    args: [address],
  })) as [bigint, boolean, string, bigint, bigint, string];

  const passesOwned = (await getAlchemyClient().readContract({
    address: PASS_ADDRESS,
    abi: PASS_ABI,
    functionName: 'balanceOf',
    args: [address, PASS_TOKEN_ID],
  })) as bigint;

  return {
    balance: BigInt(data[0]),
    hasPass: data[1],
    beneficiary: data[2],
    price: BigInt(data[3]),
    prepayMinMints: BigInt(data[4]),
    owner: data[5],
    passesOwned,
  };
}

export async function getPrepayCreatedEvents(address: string) {
  if (!isAddress(address)) {
    throw new Error(`Invalid address: ${address}`);
  }

  const events = await getAlchemyClient().getLogs({
    address: PREPAY_ADDRESS,
    event: parseAbiItem(
      'event PrepayCreated(address indexed prepayUser, uint256 indexed prepayAmount, address indexed passContract, uint256 passTokenId, uint256 prepayPrice, uint256 timestamp)'
    ),
    args: {
      prepayUser: address as `0x${string}`,
    },
    fromBlock: PREPAY_DEPLOY_BLOCK,
    toBlock: 'latest',
    strict: true,
  });

  return events;
}

export async function getAllPrepayCreatedEvents() {
  const events = await getAlchemyClient().getLogs({
    address: PREPAY_ADDRESS,
    event: parseAbiItem(
      'event PrepayCreated(address indexed prepayUser, uint256 indexed prepayAmount, address indexed passContract, uint256 passTokenId, uint256 prepayPrice, uint256 timestamp)'
    ),
    fromBlock: PREPAY_DEPLOY_BLOCK,
    toBlock: 'latest',
    strict: true,
  });

  return events;
}

export async function getPrepayMintDoneEvents() {
  const events = await getAlchemyClient().getLogs({
    address: PREPAY_ADDRESS,
    event: parseAbiItem('event MintDone(uint256 timestamp)'),
    fromBlock: PREPAY_DEPLOY_BLOCK,
    toBlock: 'latest',
    strict: true,
  });

  return events;
}

export async function getPassOwnedHistory(address?: string) {
  if (address && !isAddress(address)) {
    throw new Error(`Invalid address: ${address}`);
  }
  address = address?.toLowerCase();

  const eventsTransferSinglePromise = getAlchemyClient().getLogs({
    address: PASS_ADDRESS,
    event: parseAbiItem(
      'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)'
    ),
    fromBlock: PASS_DEPLOY_BLOCK,
    toBlock: 'latest',
    strict: true,
  });
  const eventsTransferBatchPromise = getAlchemyClient().getLogs({
    address: PASS_ADDRESS,
    event: parseAbiItem(
      'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)'
    ),
    fromBlock: PASS_DEPLOY_BLOCK,
    toBlock: 'latest',
    strict: true,
  });
  const [eventsTransferSingle, eventsTransferBatch] = await Promise.all([
    eventsTransferSinglePromise,
    eventsTransferBatchPromise,
  ]);

  // split batch transfer events into many single events
  const eventsTransferBatchSplit = eventsTransferBatch.map((event) => {
    const ids = event.args.ids || [];
    const values = event.args.values || [];
    return ids.map((id, i) => {
      return {
        ...event,
        args: {
          from: event.args.from,
          to: event.args.to,
          id,
          value: values[i],
        },
      };
    });
  });

  // merge into one array with timestamp, amount history
  const executingPromises: {
    blockNumber: bigint;
    resolve: (block: Block) => void;
    reject: (error: Error) => void;
  }[] = [];
  let executing = false;
  if (address) {
    const intervalId = setInterval(async () => {
      if (executing) {
        const toExecute = executingPromises.shift();

        if (toExecute) {
          try {
            const block = await getAlchemyClient().getBlock({
              blockNumber: toExecute.blockNumber,
              includeTransactions: false,
            });
            toExecute.resolve(block);
          } catch (e) {
            toExecute.reject(e as Error);
          }
        } else {
          clearInterval(intervalId);
        }
      }
    }, 100);
  }

  const blockTimePromises: Map<bigint, Promise<Block>> = new Map();
  const events = await Promise.all(
    [...eventsTransferSingle, ...eventsTransferBatchSplit.flat()]
      .filter((event) => {
        if (event.args.id !== PASS_TOKEN_ID) {
          return false;
        } else if (
          address &&
          event.args.to.toLowerCase() !== address &&
          event.args.from.toLowerCase() !== address
        ) {
          return false;
        } else if (event.args.value == 0n) {
          return false;
        } else if (!event.blockNumber) {
          return false;
        }
        return true;
      })
      .map(async (event) => {
        const blockNumber = event.blockNumber as bigint;

        let blockTimePromise: Promise<Block> = undefined as any;

        if (address) {
          if (!blockTimePromises.has(blockNumber as bigint)) {
            blockTimePromise = new Promise<Block>((resolve, reject) => {
              executingPromises.push({ blockNumber, resolve, reject });
            });
            blockTimePromises.set(blockNumber, blockTimePromise);
            executing = true;
          } else {
            blockTimePromise = blockTimePromises.get(
              blockNumber
            ) as Promise<Block>;
          }
        }
        let result;
        if (address && event.args.to.toLowerCase() === address) {
          result = event.args.value;
        } else if (address && event.args.from.toLowerCase() === address) {
          result = -event.args.value;
        } else {
          result = 0n;
        }
        const timestamp = address ? (await blockTimePromise).timestamp : 0n;

        return {
          timestamp: timestamp,
          amount: event.args.value,
          from: event.args.from,
          to: event.args.to,
          transactionIndex: event.transactionIndex as number,
          logIndex: event.logIndex as number,
          transactionHash: event.transactionHash as string,
          blockNumber: event.blockNumber as bigint,
          result,
        };
      })
  );
  // sort by timestamp, then transactionIndex, then logIndex
  events.sort((a, b) => {
    if (a.timestamp !== b.timestamp) {
      return Number(a.timestamp - b.timestamp);
    }
    if (a.transactionIndex !== b.transactionIndex) {
      return (a.transactionIndex ?? 0) - (b.transactionIndex ?? 0);
    }
    return (a.logIndex ?? 0) - (b.logIndex ?? 0);
  });

  return events;
}

export async function checkUserOwnPass(
  addresses: string[],
  block?: bigint
): Promise<string[]> {
  const results = (await getAlchemyClient().readContract({
    abi: PASS_ABI,
    address: PASS_ADDRESS,
    functionName: 'balanceOfBatch',
    args: [addresses, addresses.map(() => PASS_TOKEN_ID)],
    blockNumber: block,
  })) as bigint[];

  return addresses.filter((_, i) => results[i] > 0);
}

export async function prepay(
  address: string,
  value: bigint,
  amount: number
): Promise<WriteContractResult> {
  if (!isAddress(address)) {
    throw new Error(`Invalid address: ${address}`);
  }

  const account = getAccount();
  if (!account || !account.address) {
    throw new Error('No account');
  }

  const walletClient = await getConnectedWalletClient();
  if (!walletClient) {
    throw new Error('No wallet client');
  }

  return await writeContract({
    address: PREPAY_ADDRESS,
    abi: PREPAY_ABI,
    functionName: 'createPrepay',
    args: [address, amount],
    value,
    account: account.address as `0x${string}`,
  });
}

export async function userMintComplete(): Promise<WriteContractResult> {
  const account = getAccount();
  if (!account || !account.address) {
    throw new Error('No account');
  }

  const walletClient = await getConnectedWalletClient();
  if (!walletClient) {
    throw new Error('No wallet client');
  }

  return await writeContract({
    address: PREPAY_ADDRESS,
    abi: PREPAY_ABI,
    functionName: 'userMintComplete',
    args: [Math.floor(new Date().getTime() / 1000)],
    account: account.address as `0x${string}`,
  });
}
