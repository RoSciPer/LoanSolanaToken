import React, { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { initiateLoan, takeLoan, LoanResponse } from "../api/loan";
import { SystemProgram, Transaction, PublicKey } from "@solana/web3.js";

type Props = {
  userPublicKey: string;
};

export const LoanForm: React.FC<Props> = ({ userPublicKey }) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTakeLoan = async () => {
    setStatus(null);
    setLoading(true);

    try {
      if (!publicKey) throw new Error("Wallet nav pieslēgts!");

      // 1. Saņem ķīlas info no backend (kur jāpārskaita SOL)
      const initResp = await initiateLoan(userPublicKey);
      if (!initResp || !initResp.collateralAmount || !initResp.collateralReceiver) {
        throw new Error("Nevarēja saņemt ķīlas informāciju");
      }

      // 2. Izveido un nosūti SOL pārskaitījumu (ķīla)
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(initResp.collateralReceiver),
          lamports: initResp.collateralAmount,
        })
      );

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");

      // 3. Paziņo backend, ka ķīla pārskaitīta, nododot parakstu
      const loanResp: LoanResponse = await takeLoan(userPublicKey, signature);

      if (loanResp.success) {
        setStatus("Loan paņemts veiksmīgi!");
      } else {
        setStatus(`Kļūda: ${loanResp.error}`);
      }
    } catch (e: any) {
      setStatus(`Kļūda: ${e.message || String(e)}`);
    }

    setLoading(false);
  };

  return (
    <div>
      <button onClick={handleTakeLoan} disabled={loading}>
        {loading ? "Notiek aizdevuma paņemšana..." : "Paņemt aizdevumu"}
      </button>
      {status && <div style={{ marginTop: 8 }}>{status}</div>}
    </div>
  );
};
