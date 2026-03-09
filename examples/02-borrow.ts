/**
 * Example: Borrow tokens from a bank
 *
 * This example shows how to:
 * 1. Initialize the ZeroClient from config
 * 2. Fetch a marginfi account
 * 3. Create a wrapper for clean API
 * 4. Check max borrow capacity
 * 5. Build and simulate borrow transaction
 *
 * Setup:
 * 1. Copy .env.example to .env
 * 2. Fill in your configuration values
 * 3. Run: tsx 02-borrow.ts
 */

import {
  ZeroClient,
  MarginfiAccountWrapper,
  MarginfiAccount,
  AssetTag,
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

const BORROW_AMOUNT = "50"; // USDC amount to borrow (UI units)

// ============================================================================
// Main Example
// ============================================================================

async function borrowExample() {
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
  // Step 4: Select Bank
  // --------------------------------------------------------------------------
  console.log("\n🏦 Selecting USDC bank...");

  const usdcBanks = client.getBanksByMint(MINTS.USDC, AssetTag.DEFAULT);

  if (usdcBanks.length === 0) {
    throw new Error("USDC bank not found");
  }

  const usdcBank = usdcBanks[0];
  console.log(`✅ Bank selected: ${usdcBank.address.toBase58()}`);
  console.log(`   Mint: ${usdcBank.mint.toBase58()}`);

  // --------------------------------------------------------------------------
  // Step 5: Check Borrow Capacity
  // --------------------------------------------------------------------------
  console.log("\n📊 Checking borrow capacity...");

  const maxBorrow = wrappedAccount.computeMaxBorrowForBank(usdcBank.address);
  console.log(`   Max borrow: ${maxBorrow.toString()} USDC`);

  // --------------------------------------------------------------------------
  // Step 6: Build Borrow Transaction
  // --------------------------------------------------------------------------
  const actualBorrowAmount = Math.min(
    Number(BORROW_AMOUNT),
    maxBorrow.toNumber()
  ).toString();
  console.log(
    `\n📝 Building borrow transaction for ${actualBorrowAmount} USDC...`
  );

  const borrowResult = await wrappedAccount.makeBorrowTx(
    usdcBank.address,
    actualBorrowAmount
  );

  console.log(`✅ Transaction built successfully`);
  console.log(`   Total transactions: ${borrowResult.transactions.length}`);
  console.log(`   Action transaction index: ${borrowResult.actionTxIndex}`);

  // --------------------------------------------------------------------------
  // Step 7: Simulate Transaction Bundle
  // --------------------------------------------------------------------------
  console.log("\n🔄 Simulating transaction bundle...");

  try {
    const simulationResults = await simulateBundle(connection.rpcEndpoint, borrowResult.transactions);

    console.log("\n✅ Bundle simulation successful!");
    simulationResults.forEach((result, index) => {
      console.log(`\n   Transaction ${index + 1}:`);
      if (result.err) {
        console.log(`   ❌ Error: ${JSON.stringify(result.err)}`);
        if (result.logs && result.logs.length > 0) {
          console.log(`   Logs:`);
          result.logs.forEach(log => console.log(`     ${log}`));
        }
      } else {
        console.log(`   ✅ Success`);
        console.log(`   Compute units: ${result.unitsConsumed || 'N/A'}`);
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

borrowExample()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
