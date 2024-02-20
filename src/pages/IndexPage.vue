<template>
  <link href="https://fonts.googleapis.com/css?family=Montserrat:700" rel="stylesheet">
  <q-page class="row items-center justify-evenly">
    <q-header elevated style="background-color: #131313">
      <q-toolbar>
        <q-avatar square>
          <img src="~assets/cc.png" />
        </q-avatar>
        <q-toolbar-title class="full-title navtitle">
          ClickCreate PrePay
        </q-toolbar-title>
        <q-toolbar-title class="short-title navtitle"> CC PrePay </q-toolbar-title>
        <w3m-core-button icon="hide" v-if="connected"> </w3m-core-button>
      </q-toolbar>
    </q-header>
    <w3m-core-button icon="hide" v-if="!connected"> </w3m-core-button>
    <div v-if="connected" style="text-align: center">
      <q-space style="padding: 1vh" />
      <q-btn @click="openPrepayModal(address)" :disable="!hasPass"
        >Prepay for {{ address.slice(0, 6) }}...{{ address.slice(-4) }}
        <q-tooltip v-if="!hasPass"
          >You must own the ClickCreate SubPass to prepay!</q-tooltip
        >
      </q-btn>
      <q-space style="padding: 1vh" />
      <q-btn
        @click="
          prepayOverride = false;
          prepayEvents = [];
          prepayEventsLoading = true;
          tryRefreshPageState(true);
        "
        v-if="prepayOverride"
        >↺ Return to homepage</q-btn
      >
      <q-btn @click="prepayBehalfModal = true" v-else
        >Prepay for another wallet</q-btn
      >
      <q-space style="padding: 1vh" />

      <q-btn
        v-if="connectedAddress.toLowerCase() === owner.toLowerCase()"
        @click="openAdminModal()"
        :loading="adminModalLoading"
        >Admin Section</q-btn
      >

      <q-space style="padding: 1vh" />
      <div style="color: white;">
        Mints Remaining: {{ prepayMintsRemaining }}
        <q-space style="padding: 0.1vh" />
        Passes Held: {{ passesHeld }}
      </div>

      <div style="padding-top: 2vh"></div>

      <q-list
        bordered
        separator
        class="rounded-borders"
        style="border: 1px solid #010101; width: auto"
      >
        <q-item-label header style="color: white">Prepay History</q-item-label>

        <div
          v-if="prepayEvents.length === 0 && prepayEventsLoading"
          style="padding-bottom: 20px"
        >
          <q-spinner color="primary" size="2em" />
        </div>

        <q-item
          v-for="prepayEvent in prepayEvents.slice(
            0,
            prepayEventsShowAll ? prepayEvents.length : 10
          )"
          :key="prepayEvent.random"
        >
          <q-item-section
            top
            class="col-2"
            style="white-space: nowrap; width: 7.5em"
            side
          >
            <q-item-label class="q-mt-sm" style="color: white">{{
              prepayEvent.title
            }}</q-item-label>
          </q-item-section>

          <q-item-section top style="padding-left: 10px;" class="q-mt-sm">
            <q-item-label lines="1">
              <span class="text-weight-medium" style="color: gray">{{
                prepayEvent.boldTitle
              }}</span>
              <span class="text-grey-8" v-if="$q.screen.width >= 500"> - {{ prepayEvent.timestamp }} </span>
              <span class="text-grey-8" v-else-if="$q.screen.width >= 400"> - {{ prepayEvent.timestamp.split(',')[0] }} </span>
              <span class="text-grey-8" v-else> - {{ prepayEvent.timestamp.split(',')[0].slice(0, 5) }} </span>
            </q-item-label>
            <q-item-label
              caption
              lines="1"
              v-if="prepayEvent.value"
              class="row justify-center items-center"
              style="color: lightslategray"
            >
              {{ prepayEvent.value }} ETH
              <img
                style="padding-left: 5px; width: 100%; max-width: 15px"
                src="~assets/eth.png"
              />
            </q-item-label>
            <q-item-label
              caption
              lines="1"
              v-if="prepayEvent.passes"
              class="row justify-center items-center"
              style="color: lightslategray"
            >
              {{ prepayEvent.passes }} Passes
              <img
                style="padding-left: 5px; width: 100%; max-width: 18px"
                src="~assets/clickcreate2.webp"
              />
            </q-item-label>
          </q-item-section>

          <q-item-section top side>
            <div class="text-grey-8 q-gutter-xs">
              <q-btn
                size="12px"
                flat
                dense
                round
                icon="launch"
                @click="openLink(getExplorerTx(prepayEvent.txHash))"
              />
            </div>
          </q-item-section>
        </q-item>

        <q-item
          v-if="prepayEvents.length > 10 && !prepayEventsShowAll"
          style="color: gray; text-decoration: underline"
          class="row items-center justify-center"
        >
          <div
            style="cursor: pointer"
            @click="
              prepayEventsShowAll = true;
            "
          >
            ... and {{ prepayEvents.length - 10 }} more
          </div>
        </q-item>
      </q-list>

      <q-space style="padding: 1vh" />

      <q-dialog v-model="prepayBehalfModal">
        <q-card
          style="
            background-color: #212121;
            width: max(20vw, 400px);
            padding-bottom: 10px;
          "
          class="row justify-center"
        >
          <q-input
            outlined
            v-model="prepayBehalfModalText"
            label="PrePay For"
            style="padding: 20px; width: 100%"
            input-style="color: white;"
            :loading="prepayBehalfModalTextLoading"
            :rules="[() => prepayBehalfModalTextValid]"
            @update:model-value="validateInputs()"
            reactive-rules
            id="prepay-for"
          >
            <template v-slot:error> {{ prepayBehalfModalTextError }} </template>
            <template v-slot:append>
              <q-btn
                @click="
                  prepayOverride = true;
                  address = prepayBehalfModalText;
                  prepayEvents = [];
                  prepayBehalfModal = false;
                  prepayEventsLoading = true;
                  tryRefreshPageState(true);
                "
                :disable="!prepayBehalfModalButtonEnabled"
                >Go</q-btn
              >
            </template>
          </q-input>
        </q-card>
      </q-dialog>
      <q-dialog v-model="prepayModal">
        <q-card
          style="
            background-color: #212121;
            width: max(20vw, 400px);
          "
          class="column justify-center items-center"
        >
          <q-card-section style="color: #fff">
            <q-card-title class="text-h6"
              >Prepay for {{ prepayModalAddress.slice(0, 6) }}...{{
                prepayModalAddress.slice(-4)
              }}</q-card-title
            >
          </q-card-section>
          <q-card-section class="column justify-center items-center">
            <PlusMinus
              :value="prepayModalAmountMints"
              :min="minMints"
              :max="Number(balance / price)"
              @input="prepayModalAmountMints = $event"
            ></PlusMinus>
            <div style="color: #fff" class="row justify-center items-center">
              Cost:
              {{ formatEther(BigInt(prepayModalAmountMints) * price) }}
              ETH
              <img
                style="padding-left: 5px; width: 100%; max-width: 15px"
                src="~assets/eth.png"
              />
            </div>
          </q-card-section>
          <q-card-section style="color: white; display: flex; align-items: center;">
            <q-checkbox
              v-model="prepayAgreed"
              label=""
              color="black"
            />
            <span>
              I agree to the <a href="/tos.txt" target="_blank" style="color: white">Terms and Conditions</a>.
            </span>
          </q-card-section>
          <q-card-section>
            <q-btn
              @click="prepayMints"
              :loading="prepayModalLoading"
              :disabled="prepayModalAmountMints > Number(balance / price) || !prepayAgreed"
              >Prepay {{ prepayModalAmountMints }} Mints
              <q-tooltip v-if="prepayModalAmountMints > Number(balance / price)"
                >Not enough ETH</q-tooltip
              >
              <q-tooltip v-else-if="!prepayAgreed"
                >You must agree!</q-tooltip
              >
            </q-btn>
          </q-card-section>
        </q-card>
      </q-dialog>
      <q-dialog v-model="adminModal">
        <q-card
          style="
            background-color: #212121;
            min-width: max(30vw, 400px);
            min-height: max(30vh, 250px);
          "
          class="column justify-center items-center"
        >
          <q-card-section style="color: #fff">
            <q-card-title class="text-h6">Admin Section</q-card-title>
          </q-card-section>
          <q-card-section style="color: #fff; text-align: center">
            Current prepaid addresses: {{ adminModalCurrentSnapshot.length }}
            <br />
            Current prepaid mints:
            {{ adminModalCurrentSnapshot.reduce((a, b) => a + b.mints, 0) }}
          </q-card-section>
          <q-card-section>
            <q-btn
              :loading="adminModalSnapshotButtonLoading"
              @click="takeSnapshot"
              >Take Mint Snapshot</q-btn
            >
          </q-card-section>
          <div style="padding-top: 2vh"></div>
          <q-card-section>
            <q-list
              bordered
              separator
              class="rounded-borders"
              style="max-width: 60vw; border: 1px solid #010101"
              v-if="adminModalSnapshots.length > 0"
            >
              <q-item-label header style="color: white">
                Snapshots
                <div style="float: right; padding-right: 10px">
                  <span
                    style="padding-left: 10px; padding-right: 10px; color: gray"
                    >{{ adminModalSnapshotPage + 1 }}/{{
                      Math.ceil(adminModalSnapshots.length / 5)
                    }}</span
                  >
                  <q-icon
                    name="arrow_back"
                    style="cursor: pointer"
                    @click="
                      adminModalSnapshotPage = Math.max(
                        0,
                        adminModalSnapshotPage - 1
                      )
                    "
                  ></q-icon>
                  <span style="padding-left: 10px"></span>
                  <q-icon
                    name="arrow_forward"
                    style="cursor: pointer"
                    @click="
                      adminModalSnapshotPage = Math.min(
                        Math.ceil(adminModalSnapshots.length / 5) - 1,
                        adminModalSnapshotPage + 1
                      )
                    "
                  ></q-icon>
                </div>
              </q-item-label>

              <q-item
                v-for="snapshot in adminModalSnapshotsView"
                :key="snapshot.txHash"
              >
                <q-item-section
                  top
                  class="col-2 gt-sm"
                  style="white-space: nowrap; width: 7.5em"
                >
                  <q-item-label class="q-mt-sm" style="color: white"
                    >Snapshot Taken</q-item-label
                  >
                </q-item-section>

                <q-item-section top style="padding-left: 30px">
                  <q-item-label lines="1">
                    <span class="text-weight-medium" style="color: gray">
                      {{ snapshot.mintsTotal }} Mints,
                      {{ snapshot.users.length }} Addresses</span
                    >
                    <span class="text-grey-8">
                      -
                      {{ new Date(snapshot.timestamp * 1000).toLocaleString() }}
                    </span>
                  </q-item-label>
                  <q-item-label
                    caption
                    lines="1"
                    class="row justify-center items-center"
                    style="color: lightslategray"
                  >
                    {{ formatEther(BigInt(snapshot.mintsTotal) * price) }}
                    ETH
                    <img
                      style="padding-left: 5px; width: 100%; max-width: 15px"
                      src="~assets/eth.png"
                    />
                  </q-item-label>
                </q-item-section>

                <q-item-section top side>
                  <div class="text-grey-8 q-gutter-xs">
                    <q-btn-dropdown size="12px" flat dense round>
                      <q-list style="background-color: #212121; color: #fff">
                        <q-item
                          clickable
                          v-close-popup
                          @click="downloadSnapshot(snapshot)"
                        >
                          <q-item-section>
                            <q-item-label> Download Addresses </q-item-label>
                          </q-item-section>
                        </q-item>
                        <q-item
                          clickable
                          v-close-popup
                          @click="openLink(getExplorerTx(snapshot.txHash))"
                        >
                          <q-item-section>
                            <q-item-label> View Transaction </q-item-label>
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </q-btn-dropdown>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script lang="ts">
import { Ref, computed, defineComponent, ref } from 'vue';
import {
  trySwitchChain,
  registerRefreshFunction,
  getAddressBalance,
} from 'src/scripts/wallet';
import { getAccount } from '@wagmi/core';
import {
  getAddressInfo,
  getPrepayCreatedEvents,
  getPrepayMintDoneEvents,
  getAllPrepayCreatedEvents,
  prepay,
  userMintComplete,
  getPassOwnedHistory,
} from 'src/scripts/prepay';
import { isAddress } from 'viem';
import PlusMinus from 'components/PlusMinus.vue';
import { ethers } from 'ethers';
import { getUsefulError, manageLiveTx, showError } from 'src/scripts/notify';
import { openLink } from 'src/scripts/util';
import { getExplorerTx } from 'src/scripts/explorer';

const formatEther = ref(ethers.formatEther);

let DEFUALT_MIN_MINTS = 1;

const connected = ref(false);
const address = ref('');
const prepayOverride = ref(false);
const connectedAddress = ref('');
const balance = ref(0n);
const hasPass = ref(false);
const price = ref(0n);
const owner = ref('');
const minMints = ref(DEFUALT_MIN_MINTS);
const passesHeld = ref(0n);
const prepayAgreed = ref(false);
/*const agreedMessage = computed(() => {
  return `I agree to pay ${ethers.formatEther(
    BigInt(prepayModalAmountMints.value) * price.value
  )} ETH for ${
    prepayModalAmountMints.value
  } ClickCreate Mints. This payment is non-refundable.`;
  // return `Please be advised that by checking this box, you are authorizing the payment of ${ethers.formatEther(BigInt(prepayModalAmountMints.value) * price.value)} Ether ($ETH) for the minting of ${prepayModalAmountMints.value} units of ClickCreate Primary Drop NFTs, to be distributed weekly in the upcoming weeks. Kindly note that all transactions, payments, and allocations made via the ClickCreate Prepay App are non-refundable`;
});*/

interface PrepayEvent {
  title:
    | 'Prepaid Mints'
    | 'Prepay Mint Done'
    | 'Missed Prepay'
    | 'Gained Passes'
    | 'Lost Passes'
    | 'Became Eligible'
    | 'Became Ineligible';
  boldTitle: string;
  timestamp: string;
  timestampNum: number;
  txHash: string;
  value?: string;
  random: number;
  mintsum: number;
  passes?: number;
}
const prepayEvents: Ref<PrepayEvent[]> = ref([]);
const prepayEventsLoading: Ref<boolean> = ref(true);
const prepayMintsRemaining = computed(() => {
  let runningCount = 0;
  const prepayEventArr: PrepayEvent[] = [...prepayEvents.value].reverse();
  for (const event of prepayEventArr) {
    if (runningCount + event.mintsum >= 0) {
      runningCount += event.mintsum;
    }
  }
  return runningCount;
});
const prepayEventsShowAll = ref(false);

const prepayModal = ref(false);
const prepayModalAddress = ref('');
const prepayModalAmountMints = ref(DEFUALT_MIN_MINTS);
const prepayModalLoading = ref(false);

const prepayBehalfModal = ref(false);
const prepayBehalfModalText = ref('');
const prepayBehalfModalTextValid = ref(true);
const prepayBehalfModalTextLoading = ref(false);
const prepayBehalfModalTextError = ref('');
const prepayBehalfModalButtonEnabled = ref(false);

interface MintUser {
  address: string;
  mints: number;
}
interface AdminSnapshot {
  timestamp: number;
  txHash: string;
  users: MintUser[];
  blockNumber: bigint;
  mintsTotal: number;
}
const adminModal = ref(false);
const adminModalCurrentSnapshot = ref<MintUser[]>([]);
const adminModalLoading = ref(false);
const adminModalSnapshots = ref<AdminSnapshot[]>([]);
const adminModalSnapshotsView = computed(() => {
  return adminModalSnapshots.value.slice(
    adminModalSnapshotPage.value * 5,
    adminModalSnapshotPage.value * 5 + 5
  );
});
const adminModalSnapshotPage = ref(0);
const adminModalSnapshotButtonLoading = ref(false);

interface PrepayAccount {
  isConnected: boolean;
  address: string;
  connectedAddress: string;
}
function getPrepayAccount(): PrepayAccount {
  const account = getAccount();
  if (prepayOverride.value) {
    return {
      isConnected: account.isConnected,
      address: address.value,
      connectedAddress: account.address as string,
    };
  } else {
    return {
      isConnected: account.isConnected,
      address: account.address as string,
      connectedAddress: account.address as string,
    };
  }
}

async function tryRefreshPageState(force = false) {
  const account = getPrepayAccount();
  connectedAddress.value = account.connectedAddress;
  if (account.isConnected && !connected.value) {
    connected.value = true;
    address.value = account.address as string;
  } else if (!account.isConnected && connected.value) {
    connected.value = false;
    address.value = '';
  } else if (
    account.isConnected &&
    connected.value &&
    account.address !== address.value
  ) {
    address.value = account.address as string;
  } else {
    if (!force) return;
  }

  if (!(await trySwitchChain())) {
    return;
  }

  try {
    const info = await getAddressInfo(address.value);
    balance.value = prepayOverride.value
      ? await getAddressBalance(account.connectedAddress)
      : info.balance;
    hasPass.value = info.hasPass;
    price.value = info.price;
    owner.value = info.owner;
    passesHeld.value = info.passesOwned;
    const [prepayCreatedEvents, passOwnershipHistory] = await Promise.all([
      getPrepayCreatedEvents(address.value),
      getPassOwnedHistory(address.value),
    ]);
    prepayEventsLoading.value = true;
    prepayEvents.value = prepayEvents.value.filter(
      (event) => event.title !== 'Prepaid Mints'
    );
    prepayCreatedEvents.forEach((event) => {
      prepayEvents.value.push({
        title: 'Prepaid Mints',
        boldTitle: `${event.args.prepayAmount} Mints`,
        timestamp: new Date(
          Number(event.args.timestamp) * 1000
        ).toLocaleString(),
        timestampNum: Number(event.args.timestamp),
        txHash: event.transactionHash ?? '',
        value: ethers.formatEther(
          (event.args.prepayAmount ?? 0n) * price.value
        ),
        random: Math.random(),
        mintsum: Number(event.args.prepayAmount),
      });
      prepayEventsLoading.value = false;
    });
    prepayEvents.value = prepayEvents.value.filter(
      (event) =>
        event.title !== 'Gained Passes' &&
        event.title !== 'Lost Passes' &&
        event.title !== 'Became Eligible' &&
        event.title !== 'Became Ineligible'
    );
    let passBalance = 0n;
    let eligible = false;
    passOwnershipHistory.forEach((event) => {
      let boldTitle;
      let title: 'Gained Passes' | 'Lost Passes';
      if (event.result == 1n) {
        title = 'Gained Passes';
        boldTitle = 'Gained 1 Pass';
      } else if (event.result == -1n) {
        title = 'Lost Passes';
        boldTitle = 'Lost 1 Pass';
      } else if (event.result > 1n) {
        title = 'Gained Passes';
        boldTitle = `Gained ${event.result} Passes`;
      } else {
        title = 'Lost Passes';
        boldTitle = `Lost ${-event.result} Passes`;
      }
      passBalance += event.result;
      prepayEvents.value.push({
        title: title,
        boldTitle: boldTitle,
        timestamp: new Date(Number(event.timestamp) * 1000).toLocaleString(),
        timestampNum: Number(event.timestamp),
        txHash: event.transactionHash ?? '',
        random: Math.random(),
        mintsum: 0,
        passes: Number(passBalance),
      });
      if (passBalance > 0 && !eligible) {
        eligible = true;
        prepayEvents.value.push({
          title: 'Became Eligible',
          boldTitle:
            passBalance == 1n ? 'Has 1 Pass' : `Has ${passBalance} Passes`,
          timestamp: new Date(Number(event.timestamp) * 1000).toLocaleString(),
          timestampNum: Number(event.timestamp + 1n),
          txHash: event.transactionHash ?? '',
          random: Math.random(),
          mintsum: 0,
        });
      } else if (passBalance <= 0 && eligible) {
        eligible = false;
        prepayEvents.value.push({
          title: 'Became Ineligible',
          boldTitle: '0 Passes',
          timestamp: new Date(Number(event.timestamp) * 1000).toLocaleString(),
          timestampNum: Number(event.timestamp + 1n),
          txHash: event.transactionHash ?? '',
          random: Math.random(),
          mintsum: 0,
        });
      }
      prepayEventsLoading.value = false;
    });

    prepayEvents.value.sort((a, b) => b.timestampNum - a.timestampNum);

    getPrepayMintDoneEvents()
      .then((events) => {
        prepayEvents.value = prepayEvents.value.filter(
          (event) => event.title !== 'Prepay Mint Done'
        );
        events.forEach((event) => {
          let passBalance = 0;
          passOwnershipHistory
            .filter(
              (ownershipEvent) =>
                ownershipEvent.timestamp <= event.args.timestamp
            )
            .forEach((event) => {
              passBalance += Number(event.result);
            });
          let mintsPaid = 0;
          prepayEvents.value
            .filter(
              (prepayEvent) => prepayEvent.timestampNum <= event.args.timestamp
            )
            .forEach((event) => {
              mintsPaid += event.mintsum;
            });

          if (passBalance > 0 && mintsPaid > 0) {
            const mintsDone = Math.min(mintsPaid, passBalance);
            prepayEvents.value.push({
              title: 'Prepay Mint Done',
              boldTitle: `-${mintsDone} Mints`,
              timestamp: new Date(
                Number(event.args.timestamp) * 1000
              ).toLocaleString(),
              timestampNum: Number(event.args.timestamp),
              txHash: event.transactionHash ?? '',
              random: Math.random(),
              mintsum: -mintsDone,
            });
          } else if (passBalance <= 0 && mintsPaid > 0) {
            prepayEvents.value.push({
              title: 'Missed Prepay',
              boldTitle: 'No Passes',
              timestamp: new Date(
                Number(event.args.timestamp) * 1000
              ).toLocaleString(),
              timestampNum: Number(event.args.timestamp),
              txHash: event.transactionHash ?? '',
              random: Math.random(),
              mintsum: 0,
            });
          } else if (passBalance > 0 && mintsPaid <= 0) {
            prepayEvents.value.push({
              title: 'Missed Prepay',
              boldTitle: 'No Mints',
              timestamp: new Date(
                Number(event.args.timestamp) * 1000
              ).toLocaleString(),
              timestampNum: Number(event.args.timestamp),
              txHash: event.transactionHash ?? '',
              random: Math.random(),
              mintsum: 0,
            });
          } else {
            prepayEvents.value.push({
              title: 'Missed Prepay',
              boldTitle: 'Ineligible',
              timestamp: new Date(
                Number(event.args.timestamp) * 1000
              ).toLocaleString(),
              timestampNum: Number(event.args.timestamp),
              txHash: event.transactionHash ?? '',
              random: Math.random(),
              mintsum: 0,
            });
          }
          prepayEventsLoading.value = false;
        });
        prepayEvents.value.sort((a, b) => b.timestampNum - a.timestampNum);
      })
      .catch((e) => {
        showError(getUsefulError(e));
        showError('Failed to get Prepay Mint Done events');
        console.error(e);
      });
  } catch (e) {
    showError(getUsefulError(e));
    showError('Failed to refresh page state');
    console.error(e);
  }
}

async function prepayMints() {
  const callback = async () => {
    prepayModalLoading.value = false;
    await tryRefreshPageState(true);
  };
  try {
    prepayModalLoading.value = true;
    manageLiveTx(
      prepay(
        address.value,
        BigInt(prepayModalAmountMints.value) * price.value,
        prepayModalAmountMints.value
      ),
      `Prepaying ${prepayModalAmountMints.value} Mints`,
      `Prepaid ${prepayModalAmountMints.value} Mints`,
      'Failed to prepay mints',
      callback,
      callback
    );
  } catch (e) {
    prepayModalLoading.value = false;
  }
}

function openPrepayModal(address: string) {
  prepayBehalfModal.value = false;

  prepayModalAddress.value = address;
  prepayModalAmountMints.value = DEFUALT_MIN_MINTS;
  prepayModal.value = true;
}

async function openAdminModal() {
  try {
    adminModalLoading.value = true;
    const [allPrepayEvents, snapshotEvents, passOwnershipHistory] =
      await Promise.all([
        getAllPrepayCreatedEvents(),
        getPrepayMintDoneEvents(),
        getPassOwnedHistory(),
      ]);
    console.log(passOwnershipHistory);
    const snapshots: AdminSnapshot[] = [];
    allPrepayEvents.sort((a, b) => Number(a.args.timestamp - b.args.timestamp));
    snapshotEvents.sort((a, b) => Number(a.args.timestamp - b.args.timestamp));
    adminModalSnapshotPage.value = 0;
    snapshotEvents.forEach((event) => {
      snapshots.push({
        users: [],
        timestamp: Number(event.args.timestamp),
        txHash: event.transactionHash ?? '',
        blockNumber: event.blockNumber ?? 0n,
        mintsTotal: 0,
      });
    });
    const addresses = new Set<string>();
    allPrepayEvents.forEach((event) => {
      addresses.add(event.args.prepayUser.toLowerCase());
    });
    const currentUsers = [];
    for (const address of addresses) {
      let lastSnapshotTime = 0;
      let lastSnapshotBlock = 0n;
      let currentMints = 0;
      let passesHeld = 0;
      for (const snapshot of snapshots) {
        const prepayEvents = allPrepayEvents.filter(
          (event) =>
            event.args.prepayUser.toLowerCase() === address &&
            Number(event.args.timestamp) > lastSnapshotTime &&
            Number(event.args.timestamp) <= snapshot.timestamp
        );
        const passEvents = passOwnershipHistory.filter(
          (event) =>
            (event.from.toLowerCase() === address ||
              event.to.toLowerCase() === address) &&
            event.blockNumber > lastSnapshotBlock &&
            event.blockNumber <= snapshot.blockNumber
        );
        passesHeld += passEvents.reduce((sum, event) => {
          if (event.from.toLowerCase() === address) {
            return sum - Number(event.amount);
          } else {
            return sum + Number(event.amount);
          }
        }, 0);
        currentMints += prepayEvents.reduce(
          (sum, event) => sum + Number(event.args.prepayAmount),
          0
        );
        if (currentMints > 0 && passesHeld > 0) {
          let mints = Math.min(currentMints, passesHeld);
          currentMints -= mints;
          snapshot.users.push({ address, mints });
        }
        lastSnapshotTime = snapshot.timestamp;
        lastSnapshotBlock = snapshot.blockNumber;
      }
      currentMints += allPrepayEvents
        .filter(
          (event) =>
            event.args.prepayUser.toLowerCase() === address &&
            Number(event.args.timestamp) > lastSnapshotTime
        )
        .reduce((sum, event) => sum + Number(event.args.prepayAmount), 0);
      const passEvents = passOwnershipHistory.filter(
        (event) =>
          (event.from.toLowerCase() === address ||
            event.to.toLowerCase() === address) &&
          event.blockNumber > lastSnapshotBlock
      );
      passesHeld += passEvents.reduce((sum, event) => {
        if (event.from.toLowerCase() === address) {
          return sum - Number(event.amount);
        } else {
          return sum + Number(event.amount);
        }
      }, 0);
      if (currentMints > 0 && passesHeld > 0) {
        currentUsers.push({
          address,
          mints: Math.min(currentMints, passesHeld),
        });
      }
    }
    snapshots.forEach((snapshot) => {
      snapshot.mintsTotal = snapshot.users.reduce((a, b) => a + b.mints, 0);
    });
    adminModalSnapshots.value = snapshots.sort((a, b) =>
      Number(b.timestamp - a.timestamp)
    );
    adminModalCurrentSnapshot.value = currentUsers;
    adminModal.value = true;
    adminModalLoading.value = false;
    console.log('snapshots', snapshots);
    console.log('adminModalSnapshotsView.value', adminModalSnapshotsView.value);
  } catch (e) {
    showError(getUsefulError(e));
    showError('Failed to fetch admin data');
    console.error(e);
    adminModalLoading.value = false;
  }
}

async function takeSnapshot() {
  const callback = async () => {
    adminModalSnapshotButtonLoading.value = false;
    await tryRefreshPageState(true);
    openAdminModal();
  };
  try {
    adminModalSnapshotButtonLoading.value = true;
    manageLiveTx(
      userMintComplete(),
      'Taking Snapshot...',
      'Took snapshot',
      'Failed to take snapshot',
      callback,
      callback
    );
  } catch (e) {
    adminModalSnapshotButtonLoading.value = false;
  }
}

function downloadSnapshot(snapshot: AdminSnapshot) {
  let csv =
    'Address,Mints,\n' +
    snapshot.users
      .map((user) => user.address + ',' + user.mints + ',\n')
      .join('');
  const anchor = document.createElement('a');
  anchor.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
  anchor.target = '_blank';
  anchor.download = `address_snapshot_${snapshot.timestamp}.csv`;
  anchor.click();
}

let lastPrepayBehalfModalValidation = 0;
async function validateInputs() {
  if (prepayBehalfModal.value) {
    prepayBehalfModalButtonEnabled.value = false;

    const now = Date.now();
    lastPrepayBehalfModalValidation = now;
    setTimeout(async () => {
      if (lastPrepayBehalfModalValidation != now) {
        return;
      }

      try {
        prepayBehalfModalTextLoading.value = true;
        if (!isAddress(prepayBehalfModalText.value.toLowerCase())) {
          prepayBehalfModalTextValid.value = false;
          prepayBehalfModalTextError.value = 'Invalid address';
        } else if (
          !(await getAddressInfo(prepayBehalfModalText.value)).hasPass
        ) {
          prepayBehalfModalTextValid.value = false;
          prepayBehalfModalTextError.value =
            "Address doesn't own the ClickCreate SubPass";
        } else {
          prepayBehalfModalTextValid.value = true;
          prepayBehalfModalTextError.value = '';
          prepayBehalfModalButtonEnabled.value = true;
        }
        prepayBehalfModalTextLoading.value = false;
      } catch (e) {
        console.error(e);
        prepayBehalfModalTextValid.value = false;
        prepayBehalfModalTextError.value = (e as Error).message;
      } finally {
        prepayBehalfModalTextLoading.value = false;
      }
    }, 500);
  }
}

export default defineComponent({
  name: 'IndexPage',
  components: {
    PlusMinus,
  },
  setup() {
    tryRefreshPageState();
    registerRefreshFunction(tryRefreshPageState);

    return {
      validateInputs,
      tryRefreshPageState,

      connected,
      address,
      connectedAddress,
      prepayOverride,
      balance,
      hasPass,
      price,
      minMints,
      owner,
      passesHeld,
      prepayAgreed,

      prepayEvents,
      prepayEventsLoading,
      prepayMintsRemaining,
      prepayEventsShowAll,

      prepayModal,
      prepayModalAddress,
      prepayModalAmountMints,
      prepayModalLoading,

      prepayBehalfModal,
      prepayBehalfModalText,
      prepayBehalfModalTextValid,
      prepayBehalfModalTextLoading,
      prepayBehalfModalTextError,
      prepayBehalfModalButtonEnabled,

      adminModal,
      adminModalLoading,
      adminModalCurrentSnapshot,
      adminModalSnapshots,
      adminModalSnapshotsView,
      adminModalSnapshotPage,
      adminModalSnapshotButtonLoading,

      formatEther,

      openLink,
      getExplorerTx,

      openPrepayModal,
      prepayMints,
      takeSnapshot,
      downloadSnapshot,

      openAdminModal,
    };
  },
});
</script>
