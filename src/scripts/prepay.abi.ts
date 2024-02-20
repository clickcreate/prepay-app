export const PREPAY_ADDRESS = '0xc1520c2369e459260d214843eb4425da6b890c2e';
export const PREPAY_DEPLOY_BLOCK = 17667720n;
// export const PREPAY_ADDRESS = '0x4a3d82ff52c04e9be630b878bcfa21b960ad9e39';
// export const PREPAY_DEPLOY_BLOCK = 3850418n;
export const PREPAY_ABI = [
  {
    inputs: [
      { internalType: 'address', name: '_prepayBeneficiary', type: 'address' },
      { internalType: 'uint256', name: '_prepayPrice', type: 'uint256' },
      { internalType: 'address', name: '_passContract', type: 'address' },
      { internalType: 'uint256', name: '_passTokenId', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  { inputs: [], name: 'IncorrectPrePayAmount', type: 'error' },
  { inputs: [], name: 'NoErroneousPayments', type: 'error' },
  { inputs: [], name: 'NoPassOwned', type: 'error' },
  { inputs: [], name: 'PaymentFailed', type: 'error' },
  { inputs: [], name: 'TooFewMints', type: 'error' },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'MintDone',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'prepayUser',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'prepayAmount',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'passContract',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'passTokenId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'prepayPrice',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'PrepayCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'oldPrepayPrice',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newPrepayPrice',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'PrepayPriceChanged',
    type: 'event',
  },
  { stateMutability: 'payable', type: 'fallback' },
  {
    inputs: [
      { internalType: 'address', name: 'prepayUser', type: 'address' },
      { internalType: 'uint256', name: 'prepayAmount', type: 'uint256' },
    ],
    name: 'createPrepay',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getInfo',
    outputs: [
      { internalType: 'uint256', name: 'balance', type: 'uint256' },
      { internalType: 'bool', name: 'hasPass', type: 'bool' },
      { internalType: 'address', name: '_prepayBeneficiary', type: 'address' },
      { internalType: 'uint256', name: '_prepayPrice', type: 'uint256' },
      { internalType: 'uint256', name: '_prepayMinMints', type: 'uint256' },
      { internalType: 'address', name: '_owner', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'passContract',
    outputs: [{ internalType: 'contract IERC1155', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'passTokenId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'prepayBeneficiary',
    outputs: [{ internalType: 'address payable', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'prepayMinMints',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'prepayPrice',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_passContract', type: 'address' },
    ],
    name: 'setPassContract',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_passTokenId', type: 'uint256' },
    ],
    name: 'setPassTokenId',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address payable',
        name: '_prepayBeneficiary',
        type: 'address',
      },
    ],
    name: 'setPrepayBeneficiary',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_prepayMinMints', type: 'uint256' },
    ],
    name: 'setPrepayMinMints',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_prepayPrice', type: 'uint256' },
    ],
    name: 'setPrepayPrice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'timestamp', type: 'uint256' }],
    name: 'userMintComplete',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  { stateMutability: 'payable', type: 'receive' },
];
