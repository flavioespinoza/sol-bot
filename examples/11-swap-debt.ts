/**
 * Example: Swap debt from one type to another (SIMULATION MODE)
 *
 * This example shows how to:
 * 1. Initialize the ZeroClient from config
 * 2. Fetch a marginfi account
 * 3. Find an existing debt position
 * 4. Build a swap debt transaction (source debt -> destination debt)
 * 5. Simulate the transaction bundle
 *
 * The swap is executed via flash loan, so account health is not affected during the swap.
 * Flow: Borrow new debt -> Jupiter swap -> Repay old debt
 *
 * Setup:
 * 1. Copy .env.example to .env
 * 2. Fill in your configuration values
 * 3. Run: tsx 11-swap-debt.ts
 *
 * Note: This runs in SIMULATION mode - no actual transactions are sent.
 */

import {
  ZeroClient,
  MarginfiAccountWrapper,
  MarginfiAccount,
  simulateBundle,
  Bank,
  AssetTag,
} from "../src";
import { PublicKey } from "@solana/web3.js";
import {
  getConnection,
  getMarginfiConfig,
  getAccountAddress,
  getWalletPubkey,
  MINTS,
} from "./config";

// ============================================================================
// Configuration - Edit these to test different scenarios
// ============================================================================

// Source debt: null = use first active debt position
const SOURCE_MINT: PublicKey | null = null;

// Destination debt: the mint to swap into (this becomes your new debt)
const DESTINATION_MINT = MINTS.SOL;

// Jupiter swap options
const SLIPPAGE_MODE: "DYNAMIC" | "FIXED" = "DYNAMIC";
const SLIPPAGE_BPS = 50; // 0.5% slippage
const PLATFORM_FEE_BPS = 0;
const DIRECT_ROUTES_ONLY = false;

// ============================================================================
// Main Example
// ============================================================================

async function swapDebtExample() {
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
  // Step 4: Find Source Debt Position
  // --------------------------------------------------------------------------
  console.log("\n💳 Checking debt positions...");

  // Get all active debt positions (borrows with liability shares > 0)
  const debtBalances = account.balances.filter(
    (balance) => balance.active && !balance.liabilityShares.isZero()
  );

  console.log(`   Found ${debtBalances.length} active debt position(s)`);

  if (debtBalances.length === 0) {
    throw new Error("No debt positions found. Borrow some tokens first using 02-borrow.ts");
  }

  // Find the source bank (either by mint or use first position)
  let sourceBank: Bank | undefined;
  let sourceBalance;

  if (SOURCE_MINT) {
    // Find balance matching the specified mint
    for (const balance of debtBalances) {
      const bank = client.bankMap.get(balance.bankPk.toBase58());
      if (bank && bank.mint.equals(SOURCE_MINT)) {
        sourceBank = bank;
        sourceBalance = balance;
        break;
      }
    }
    if (!sourceBank) {
      throw new Error(`No debt position found for mint: ${SOURCE_MINT.toBase58()}`);
    }
  } else {
    // Use first debt position
    sourceBalance = debtBalances[0];
    sourceBank = client.bankMap.get(sourceBalance.bankPk.toBase58());
    if (!sourceBank) {
      throw new Error(`Bank not found: ${sourceBalance.bankPk.toBase58()}`);
    }
  }

  // Calculate the token amount from liability shares
  const sourceTokenAmount = sourceBank.getLiabilityQuantity(sourceBalance.liabilityShares);
  const sourceUiAmount = sourceTokenAmount.div(Math.pow(10, sourceBank.mintDecimals)).toNumber();

  console.log(`\n✅ Source debt selected:`);
  console.log(`   Bank: ${sourceBank.address.toBase58()}`);
  console.log(`   Symbol: ${sourceBank.tokenSymbol || "Unknown"}`);
  console.log(`   Mint: ${sourceBank.mint.toBase58()}`);
  console.log(`   Debt: ${sourceUiAmount.toFixed(6)} tokens`);

  // --------------------------------------------------------------------------
  // Step 5: Find Destination Bank
  // --------------------------------------------------------------------------
  console.log("\n🏦 Selecting destination bank...");

  // Find a Zero bank for the destination mint (only DEFAULT and SOL asset tags support borrowing)
  const destinationBanks = client.banks.filter(
    (bank) =>
      bank.mint.equals(DESTINATION_MINT) &&
      (bank.config.assetTag === AssetTag.DEFAULT || bank.config.assetTag === AssetTag.SOL)
  );

  if (destinationBanks.length === 0) {
    throw new Error(
      `No borrowable Zero bank found for destination mint: ${DESTINATION_MINT.toBase58()}. ` +
        `Only Zero banks (DEFAULT or SOL asset tag) support borrowing.`
    );
  }

  const destinationBank = destinationBanks[0];

  console.log(`✅ Destination bank selected:`);
  console.log(`   Bank: ${destinationBank.address.toBase58()}`);
  console.log(`   Symbol: ${destinationBank.tokenSymbol || "Unknown"}`);
  console.log(`   Mint: ${destinationBank.mint.toBase58()}`);

  // Check if source and destination banks are the same
  if (sourceBank.address.equals(destinationBank.address)) {
    console.log("\n⚠️  Source and destination banks are the same - nothing to do.");
    return;
  }

  // Determine if this is a swap (different mints) or transfer (same mint, different banks)
  const isSameMint = sourceBank.mint.equals(destinationBank.mint);

  // --------------------------------------------------------------------------
  // Step 6: Build Swap Debt Transaction
  // --------------------------------------------------------------------------
  console.log("\n📝 Building swap debt transaction...");

  console.log(
    `   Swapping ${sourceUiAmount.toFixed(6)} ${sourceBank.tokenSymbol || "tokens"} debt`
  );
  console.log(`   From bank: ${sourceBank.address.toBase58()}`);
  console.log(`   To bank: ${destinationBank.address.toBase58()}`);

  if (isSameMint) {
    console.log(`   (Same mint - no Jupiter swap needed)`);
  } else {
    console.log(`   From mint: ${sourceBank.mint.toBase58()}`);
    console.log(`   To mint: ${destinationBank.mint.toBase58()}`);
    console.log(
      `   Slippage: ${SLIPPAGE_MODE === "DYNAMIC" ? "Dynamic" : `${SLIPPAGE_BPS / 100}%`}`
    );
  }

  // Get token programs for both banks
  const sourceMintData = await wrappedAccount.getMintDataFromBank(sourceBank);
  const destinationMintData = await wrappedAccount.getMintDataFromBank(destinationBank);

  const result = await wrappedAccount.makeSwapDebtTx({
    connection,
    repayOpts: {
      totalPositionAmount: sourceUiAmount,
      repayBank: sourceBank,
      tokenProgram: sourceMintData.tokenProgram,
    },
    borrowOpts: {
      borrowBank: destinationBank,
      tokenProgram: destinationMintData.tokenProgram,
    },
    swapOpts: {
      jupiterOptions: {
        slippageMode: SLIPPAGE_MODE,
        slippageBps: SLIPPAGE_BPS,
        platformFeeBps: PLATFORM_FEE_BPS,
        directRoutesOnly: DIRECT_ROUTES_ONLY,
      },
    },
  });

  console.log(`✅ Transaction built successfully`);
  console.log(`   Total transactions: ${result.transactions.length}`);
  console.log(`   Action transaction index: ${result.actionTxIndex}`);

  if (result.quoteResponse) {
    const expectedInput =
      Number(result.quoteResponse.inAmount) / Math.pow(10, destinationBank.mintDecimals);
    console.log(`\n📈 Jupiter quote:`);
    console.log(
      `   New debt amount: ~${expectedInput.toFixed(6)} ${destinationBank.tokenSymbol || "tokens"}`
    );
    console.log(`   Price impact: ${result.quoteResponse.priceImpactPct || "N/A"}%`);
  } else if (isSameMint) {
    console.log(`\n📈 Same mint (no Jupiter swap needed):`);
    console.log(`   Amount: ${sourceUiAmount.toFixed(6)} ${sourceBank.tokenSymbol || "tokens"}`);
  }

  // --------------------------------------------------------------------------
  // Step 7: Simulate Transaction Bundle
  // --------------------------------------------------------------------------
  console.log("\n🔄 Simulating transaction bundle...");

  try {
    const simulationResults = await simulateBundle(connection.rpcEndpoint, result.transactions);

    console.log("\n✅ Bundle simulation results:");
    let allSuccessful = true;

    simulationResults.forEach((simResult, index) => {
      const txType =
        index === result.actionTxIndex
          ? "SWAP DEBT"
          : index < result.actionTxIndex
            ? "SETUP"
            : "CLEANUP";

      console.log(`\n   Transaction ${index + 1} (${txType}):`);

      if (simResult.err) {
        allSuccessful = false;
        console.log(`   ❌ Error: ${JSON.stringify(simResult.err)}`);
        if (simResult.logs && simResult.logs.length > 0) {
          console.log(`   Logs:`);
          simResult.logs.slice(-5).forEach((log) => console.log(`     ${log}`));
        }
      } else {
        console.log(`   ✅ Success`);
        console.log(`   Compute units: ${simResult.unitsConsumed || "N/A"}`);
      }
    });

    if (allSuccessful) {
      console.log("\n✅ All transactions simulated successfully!");
      console.log(
        "\n💡 To execute this swap, you would sign and send these transactions in order."
      );
    } else {
      console.log("\n⚠️  Some transactions failed simulation. Check errors above.");
    }
  } catch (error) {
    console.error("\n❌ Simulation error:", error);
    throw error;
  }
}

// ============================================================================
// Run Example
// ============================================================================

swapDebtExample()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
