const express = require("express");
const router = express.Router();

const {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} = require("@solana/web3.js");

const {
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_2022_PROGRAM_ID
} = require("@solana/spl-token");

const { registerLoan, getUserActiveLoan, closeLoan, getRepayInfo } = require("../loans");

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const mint = new PublicKey(process.env.TKN_MINT);
const secret = JSON.parse(process.env.SOLANA_PRIVATE_KEY);
const serverWallet = Keypair.fromSecretKey(Uint8Array.from(secret));

const LOAN_AMOUNT = 10_000_000;
const COLLATERAL = 1 * LAMPORTS_PER_SOL;
const LOAN_TERM_SECONDS = 60*60*24*60;

// --- Funkcijas ---

async function checkAta(req, res) {
  try {
    const { userPublicKey } = req.body;
    const user = new PublicKey(userPublicKey);
    const userAta = await getAssociatedTokenAddress(mint, user, false, TOKEN_2022_PROGRAM_ID);
    const info = await connection.getAccountInfo(userAta);
    res.json({ ata: userAta.toBase58(), exists: !!info });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function initiateLoan(req, res) {
  try {
    const { userPublicKey } = req.body;
    if (!userPublicKey) throw new Error("userPublicKey required");

    res.json({
      collateralAddress: serverWallet.publicKey.toBase58(),
      amountLamports: COLLATERAL
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function takeLoan(req, res) {
  try {
    const { userPublicKey } = req.body;
    const user = new PublicKey(userPublicKey);

    const userAta = await getAssociatedTokenAddress(mint, user, false, TOKEN_2022_PROGRAM_ID);
    const info = await connection.getAccountInfo(userAta);
    if (!info) throw new Error("User ATA does not exist");

    const serverAta = await getAssociatedTokenAddress(mint, serverWallet.publicKey, false, TOKEN_2022_PROGRAM_ID);

    const tx = new Transaction().add(
      createTransferInstruction(serverAta, userAta, serverWallet.publicKey, LOAN_AMOUNT, [], TOKEN_2022_PROGRAM_ID)
    );
    const signature = await sendAndConfirmTransaction(connection, tx, [serverWallet]);

    registerLoan(user.toBase58(), LOAN_AMOUNT, COLLATERAL, signature);
    res.json({ success: true, signature });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

function repayInfo(req, res) {
  try {
    const { userPublicKey } = req.body;
    const repay = getRepayInfo(userPublicKey);
    if (!repay) return res.status(404).json({ error: "No active loan" });

    res.json({
      repayTo: process.env.REPAY_TO,
      amount: repay.amount.toString(),
      mint: repay.mint.toString()
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function repayLoan(req, res) {
  try {
    console.log("Repay pieprasījums:", req.body);
    const { userPublicKey } = req.body;
    const user = new PublicKey(userPublicKey);

    const loan = getUserActiveLoan(user.toBase58());
    if (!loan || loan.repaid) throw new Error("No active loan or already repaid");

    const serverAta = await getAssociatedTokenAddress(mint, serverWallet.publicKey, false, TOKEN_2022_PROGRAM_ID);
    const balance = await connection.getTokenAccountBalance(serverAta);

    if (Number(balance.value.amount) < loan.amount) {
      throw new Error("Not enough tokens repaid");
    }

    const now = Date.now();
    const delta = now - loan.issued_at;
    const percent = delta >= LOAN_TERM_SECONDS * 1000 ? 1.3 : 0.7;
    const rawRefund = loan.collateral * percent;

    console.log(`Aizdevums atmaksāts. Termiņš pagājis: ${delta > LOAN_TERM_SECONDS * 1000}, refund = ${refund}`);

    const tx = new Transaction().add(SystemProgram.transfer({
      fromPubkey: serverWallet.publicKey,
      toPubkey: user,
      lamports: refund
    }));
    const sig = await sendAndConfirmTransaction(connection, tx, [serverWallet]);

    closeLoan(user.toBase58(), refund);
    res.json({ success: true, refundLamports: refund, signature: sig });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

function getLoanStatus(req, res) {
  try {
    const user = req.params.user;
    const loan = getUserActiveLoan(user);
    if (!loan) return res.json({ loan_active: false });

    const termEnd = loan.issued_at + LOAN_TERM_SECONDS * 1000;
    const now = Date.now();

    res.json({
      loan_active: true,
      issued_at: loan.issued_at,
      term_ends_at: termEnd,
      seconds_left: Math.floor((termEnd - now) / 1000),
      overdue: now > termEnd
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// --- Routera maršruti ---
router.post("/check-ata", checkAta);
router.post("/initiate", initiateLoan);
router.post("/take", takeLoan);
router.post("/repay-info", repayInfo);
router.post("/repay-loan", repayLoan);
router.get("/status/:user", getLoanStatus);

module.exports = { loanRouter: router };
