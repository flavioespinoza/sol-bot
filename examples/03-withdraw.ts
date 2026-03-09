/**
 * Example: Withdraw tokens from a bank
 *
 * This example shows how to:
 * 1. Initialize the ZeroClient from config
 * 2. Fetch a marginfi account
 * 3. Check lending balances (deposits)
 * 4. Find the first position with a balance
 * 5. Calculate max withdraw capacity
 * 6. Build and simulate withdraw transaction
 *
 * Setup:
 * 1. Copy .env.example to .env
 * 2. Fill in your configuration values
 * 3. Run: tsx 03-withdraw.ts
 */

import {
  ZeroClient,
  MarginfiAccountWrapper,
  MarginfiAccount,
  simulateBundle,
} from "../src";
import {
  getConnection,
  getMarginfiConfig,
  getAccountAddress,
  getWalletPubkey,
  MINTS,
} from "./config";

// ============================================================================
// Configuration
// ============================================================================

const WITHDRAW_ALL = false; // Set to true to withdraw entire position
const WITHDRAW_PERCENTAGE = 0.1; // Withdraw 10% of available balance

// ============================================================================
// Main Example
// ============================================================================

async function withdrawExample() {
  // --------------------------------------------------------------------------
  // Step 1: Load Configuration
  // --------------------------------------------------------------------------
  console.log("\n🔧 Loading configuration...");

  const connection = getConnection();
  const walletPubkey = getWalletPubkey();
  const config = getMarginfiConfig();

  console.log(`   RPC: ${connection.rpcEndpoint}`);
  console.log(`   Environment: ${config.environment}`);
  console.log(`   Wallet: ${walletPubkey.toBase58()}`);

  // --------------------------------------------------------------------------
  // Step 2: Initialize Client
  // --------------------------------------------------------------------------
  console.log("\n📡 Initializing ZeroClient...");

  const client = await ZeroClient.initialize(connection, config);

  console.log(`✅ Client initialized`);
  console.log(`📊 Loaded ${client.banks.length} banks`);

  // --------------------------------------------------------------------------
  // Step 3: Load Marginfi Account
  // --------------------------------------------------------------------------
  console.log("\n👤 Loading marginfi account...");

  const accountAddress = getAccountAddress();
  const account = await MarginfiAccount.fetch(accountAddress, client.program);
  const wrappedAccount = new MarginfiAccountWrapper(account, client);

  console.log(`✅ Account loaded: ${account.address.toBase58()}`);

  // --------------------------------------------------------------------------
  // Step 4: Find First Lending Position
  // --------------------------------------------------------------------------
  console.log("\n💰 Checking lending balances...");

  // Get all active lending positions (deposits)
  const lendingBalances = account.balances.filter(
    (balance) => balance.active && !balance.assetShares.isZero()
  );

  console.log(`   Found ${lendingBalances.length} active lending position(s)`);

  if (lendingBalances.length === 0) {
    throw new Error("No lending positions found. Deposit some tokens first.");
  }

  // Use the first lending position
  const firstBalance = lendingBalances[0];
  const bankAddress = firstBalance.bankPk;
  const bank = client.bankMap.get(bankAddress.toBase58());

  if (!bank) {
    throw new Error(`Bank ${bankAddress.toBase58()} not found`);
  }

  // Calculate the token amount from shares
  const tokenAmount = bank.getAssetQuantity(firstBalance.assetShares);
  const uiAmount = tokenAmount.div(Math.pow(10, bank.mintDecimals));

  console.log(`\n✅ Selected first lending position:`);
  console.log(`   Bank: ${bank.address.toBase58()}`);
  console.log(`   Mint: ${bank.mint.toBase58()}`);
  console.log(`   Balance: ${uiAmount.toFixed(6)} tokens`);

  // --------------------------------------------------------------------------
  // Step 5: Check Withdraw Capacity
  // --------------------------------------------------------------------------
  console.log("\n📊 Checking withdraw capacity...");

  const maxWithdraw = wrappedAccount.computeMaxWithdrawForBank(bank.address);
  console.log(`   Max withdraw: ${maxWithdraw.toString()} tokens`);

  // Calculate actual withdraw amount (percentage of balance)
  const withdrawAmount = Math.min(
    uiAmount.toNumber() * WITHDRAW_PERCENTAGE,
    maxWithdraw.toNumber()
  ).toString();

  console.log(
    `   Withdrawing: ${withdrawAmount} tokens (${WITHDRAW_PERCENTAGE * 100}% of balance)`
  );

  // --------------------------------------------------------------------------
  // Step 6: Build Withdraw Transaction (based on asset tag)
  // --------------------------------------------------------------------------
  console.log(`\n📝 Building withdraw transaction...`);
  console.log(`   Asset tag: ${bank.config.assetTag}`);

  const assetTag = bank.config.assetTag;
  let withdrawResult;

  switch (assetTag) {
    case 0: // AssetTag.DEFAULT
    case 1: {
      // AssetTag.SOL
      console.log(`   Using standard withdraw for DEFAULT/SOL bank`);
      withdrawResult = await wrappedAccount.makeWithdrawTx(
        bank.address,
        withdrawAmount,
        WITHDRAW_ALL
      );
      break;
    }

    case 3: {
      // AssetTag.KAMINO
      console.log(`   Using Kamino withdraw for KAMINO bank`);
      const bankAddress = bank.address.toBase58();
      const kaminoState = client.bankIntegrationMap[bankAddress]?.kaminoStates;

      if (!kaminoState) {
        throw new Error("Kamino reserve state not available");
      }

      withdrawResult = await wrappedAccount.makeKaminoWithdrawTx(
        bank.address,
        withdrawAmount,
        kaminoState.reserveState,
        WITHDRAW_ALL
      );
      break;
    }

    default: {
      // STAKED (2) or any other asset tags not yet supported
      throw new Error(
        `Withdraw not implemented for asset tag ${assetTag}. ` +
          `Supported tags: 0 (DEFAULT), 1 (SOL), 3 (KAMINO)`
      );
    }
  }

  console.log(`✅ Transaction built successfully`);
  console.log(`   Total transactions: ${withdrawResult.transactions.length}`);
  console.log(`   Action transaction index: ${withdrawResult.actionTxIndex}`);

  // --------------------------------------------------------------------------
  // Step 7: Simulate Transaction Bundle
  // --------------------------------------------------------------------------
  console.log("\n🔄 Simulating transaction bundle...");

  try {
    const simulationResults = await simulateBundle(
      connection.rpcEndpoint,
      withdrawResult.transactions
    );

    console.log("\n✅ Bundle simulation successful!");
    simulationResults.forEach((result, index) => {
      console.log(`\n   Transaction ${index + 1}:`);
      if (result.err) {
        console.log(`   ❌ Error: ${JSON.stringify(result.err)}`);
        if (result.logs && result.logs.length > 0) {
          console.log(`   Logs:`);
          result.logs.forEach((log) => console.log(`     ${log}`));
        }
      } else {
        console.log(`   ✅ Success`);
        console.log(`   Compute units: ${result.unitsConsumed || "N/A"}`);
      }
    });
  } catch (error) {
    console.error("\n❌ Simulation error:", error);
    throw error;
  }
}

// ============================================================================
// Run Example
// ============================================================================

withdrawExample()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
