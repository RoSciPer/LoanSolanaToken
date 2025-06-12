import React, { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import dayjs from "dayjs";
import { SystemProgram, Transaction, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction } from "@solana/spl-token";
import {
  checkATA,
  initiateLoan,
  takeLoan,
  repayLoan,
  getLoanStatus,
} from "../api/loan";
import { CreateAtaButton } from "./CreateAtaButton";
import { TakeLoanButton } from "./TakeLoanButton";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { getRepayInfo } from "../api/loan"; // ja vēl nav importēts


const MINT_ADDRESS = import.meta.env.VITE_TOKEN2022_MINT as string;
const LOAN_TERM_DAYS = 60;

export function LoanUI() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [loanStatus, setLoanStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repayResult, setRepayResult] = useState<{ refundLamports: number; signature: string } | null>(null);
  const [ataExists, setAtaExists] = useState<boolean | null>(null);

  // Uzreiz ielādē loan statusu, kad wallet mainās
  useEffect(() => {
    if (!publicKey) {
      setLoanStatus(null);
      setError(null);
      setAtaExists(null);
      return;
    }
    setLoading(true);
    getLoanStatus(publicKey.toBase58())
      .then(setLoanStatus)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
    checkATA(publicKey.toBase58())
      .then(res => setAtaExists(res.exists))
      .catch(() => setAtaExists(false));
  }, [publicKey]);

  // Loan uzsākšana ar ķīlas pārskaitījumu
  async function handleTakeLoan() {
    setError(null);
    if (!publicKey) return;
    setLoading(true);
    try {
      // 1. Saņem ķīlas adresi un summu no backend
      const initRes = await initiateLoan(publicKey.toBase58());
      if (!initRes.collateralAddress || !initRes.amountLamports) {
        setError("Don't get SOL.");
        setLoading(false);
        return;
      }
      const collateralPubkey = new PublicKey(initRes.collateralAddress);
      // 2. Lietotājs ar maka extension paraksta pārskaitījumu
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: collateralPubkey,
          lamports: initRes.amountLamports,
        }),
      );
      const signature = await sendTransaction(tx, connection);
      // 3. Backendam paziņo par ķīlas iemaksu
      const loanRes = await takeLoan(publicKey.toBase58(), signature);
      if (loanRes.success) {
        // Ielādē statusu no backend
        const status = await getLoanStatus(publicKey.toBase58());
        setLoanStatus(status);
        setError(null);
      } else {
        setError(loanRes.error || "Loan not accepted (not right SOL?)");
      }
    } catch (e: any) {
      setError(e.message || String(e));
    }
    setLoading(false);
  }

  // Loan atmaksa (prasa tokenu pārskaitījumu)
  async function handleRepayLoan() {
  setError(null);
  if (!publicKey) return;
  setLoading(true);
  try {
    // 1. Saņem atmaksas info no backend
    const repayInfo = await getRepayInfo(publicKey.toBase58());
    if (!repayInfo?.repayTo || !repayInfo?.amount || !repayInfo?.mint) {
      setError("Nevar noteikt atmaksas adresi vai daudzumu.");
      setLoading(false);
      return;
    }

    const mint = new PublicKey(repayInfo.mint);
    const userAta = await getAssociatedTokenAddress(mint, publicKey, false, TOKEN_2022_PROGRAM_ID);
    const destinationAta = new PublicKey(repayInfo.repayTo);

    // 2. Izveido transakciju
    const ix = createTransferInstruction(
      userAta,
      destinationAta,
      publicKey,
      Number(repayInfo.amount),
      [],
      TOKEN_2022_PROGRAM_ID
    );
    const tx = new Transaction().add(ix);

    // 3. Nosūta transakciju
    const signature = await sendTransaction(tx, connection);

    // 4. Backendam paziņo par atmaksu
    const repayRes = await repayLoan(publicKey.toBase58(), signature);
    if (repayRes.success) {
      setRepayResult({ refundLamports: repayRes.refundLamports, signature: repayRes.signature });
      const status = await getLoanStatus(publicKey.toBase58());
      setLoanStatus(status);
    } else {
      setError(repayRes.error || "Repay failed");
    }
  } catch (e: any) {
    setError(e.message || String(e));
  }
  setLoading(false);
}


  // Parāda, cik dienas pagājušas
  let daysSinceLoan = 0;
  if (loanStatus && loanStatus.loan_active && loanStatus.issued_at) {
    daysSinceLoan = dayjs().diff(dayjs(loanStatus.issued_at), "day");
  }
  // Parāda, kāds būs atmaksas procents
  let refundLabel = "70%";
  if (daysSinceLoan >= LOAN_TERM_DAYS) refundLabel = "130%";

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", padding: 24, border: "1px solid #eee", borderRadius: 12 }}>
      <WalletMultiButton />
      <h2>Solana Token-2022 Loan Demo</h2>
      {!publicKey && <div>Conect wallet to start</div>}
      {publicKey && (
        <>
          <div style={{ fontSize: 12, color: "#999" }}>Wallet: {publicKey.toBase58()}</div>
          {loading && <div>Loading...</div>}

          {/* ATA pārbaude un poga */}
          {ataExists === false && (
            <div style={{ margin: "16px 0" }}>
              <div>You don't have Token account (ATA). Make ATA to take Loan!</div>
              <CreateAtaButton mint={MINT_ADDRESS} onCreated={() => setAtaExists(true)} />
            </div>
          )}

          {/* Loan poga */}
          {!loading && ataExists && loanStatus && !loanStatus.loan_active && (
            <TakeLoanButton onTakeLoan={handleTakeLoan} />
          )}

          {/* Atmaksas poga */}
          {!loading && ataExists && loanStatus && loanStatus.loan_active && !loanStatus.overdue && !repayResult && (
            <div style={{ marginTop: 16 }}>
              <div>
                Loan taked {daysSinceLoan} days ago.<br />
                Repay now, you get <b>{refundLabel} from Sol</b>.
              </div>
              <button onClick={handleRepayLoan} style={{ marginTop: 12 }}>
                Repay loan ({refundLabel} Sol)
              </button>
            </div>
          )}

          {/* Atmaksas rezultāts */}
          {repayResult && (
            <div style={{ color: "green", marginTop: 16 }}>
              Loan Repayed!<br />
              Get back: <b>{(repayResult.refundLamports / 1e9).toFixed(3)} SOL</b><br />
              Tx: <a href={`https://explorer.solana.com/tx/${repayResult.signature}?cluster=devnet`} target="_blank" rel="noopener noreferrer">{repayResult.signature.slice(0, 10)}...</a>
            </div>
          )}
          {error && (
            <div style={{ color: "red", marginTop: 16 }}>
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
}