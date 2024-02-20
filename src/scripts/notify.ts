import { WriteContractResult, waitForTransaction } from '@wagmi/core';
import { TransactionReceipt } from 'viem';
import { ETHERSCAN } from './config';
import { Notify } from 'quasar';

export function manageLiveTx(
  txPromise: Promise<WriteContractResult>,
  pendingMessage: string,
  successMessage: string,
  errorMessage: string,
  onFinish: (arg0: TransactionReceipt) => Promise<void> = async () => undefined,
  onError: (arg0: Error) => Promise<void> = async () => undefined
) {
  txPromise
    .then((tx) => {
      const txLink = `${ETHERSCAN}/tx/${tx.hash}`;
      showViewTx(pendingMessage, txLink);
      waitForTransaction({ hash: tx.hash })
        .then((receipt) => {
          showSuccess(successMessage);
          onFinish(receipt);
        })
        .catch((e) => {
          console.error(e);
          showError(errorMessage);
          showError(getUsefulError(e));
          onError(e);
        });
    })
    .catch((e) => {
      console.error(e);
      showError(errorMessage);
      showError(getUsefulError(e));
      onError(e);
    });
}

export function showViewTx(msg: string, txLink: string) {
  Notify.create({
    message: msg,
    color: 'green',
    position: 'top',
    actions: [
      {
        label: 'View Tx',
        color: 'white',
        style: 'background-color: green',
        handler: () => {
          window.open(txLink, '_blank');
        },
      },
    ],
    timeout: 30 * 1000,
  });
}

export function showSuccess(msg: string, timeout = 30 * 1000) {
  Notify.create({
    message: msg,
    color: 'green',
    position: 'top',
    actions: [
      {
        label: 'Ok',
        color: 'white',
        style: 'background-color: green',
        handler: () => {
          /* ... */
        },
      },
    ],
    timeout,
  });
}

export function showError(err: string) {
  Notify.create({
    message: err,
    color: 'red',
    position: 'top',
    actions: [
      {
        label: 'Ok',
        color: 'white',
        style: 'background-color: red',
        handler: () => {
          /* ... */
        },
      },
    ],
    timeout: 30 * 1000,
  });
}

export function getUsefulError(e: any) {
  //console.log(typeof e)
  if (typeof e === 'object') {
    const msg = e.message;
    e = msg;

    if (msg.toString().includes("'")) {
      const start = msg.indexOf("'");
      const end = msg.lastIndexOf("'");
      const jsonString = msg.substring(start + 1, end);
      //console.log(jsonString)
      const json = JSON.parse(jsonString);

      return json.value.data.message;
    }
  }

  let err = e.toString();
  if (err.startsWith('Error: ')) {
    err = err.substring(7);
  }

  return err;
}
