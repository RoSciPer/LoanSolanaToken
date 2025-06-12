import React, { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from "@solana/spl-token";
import { Transaction, PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

export function CreateAtaButton({ mint, onCreated }: { mint: string, onCreated?: () => void }) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateATA() {
  setLoading(true); setError(null);
  try {
    if (!publicKey) throw new Error("Wallet nav pieslēgts!");
    const mintPk = new PublicKey(mint);
    const ata = await getAssociatedTokenAddress(
      mintPk, 
      publicKey, 
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const ataInfo = await connection.getAccountInfo(ata);
    if (ataInfo !== null) {
      setSuccess(true);
      return; // ATA jau eksistē
    }

    const ix = createAssociatedTokenAccountInstruction(
      publicKey, 
      ata, 
      publicKey, 
      mintPk,
      TOKEN_2022_PROGRAM_ID
    );
    const tx = new Transaction().add(ix);
    const signature = await sendTransaction(tx, connection);
    await connection.confirmTransaction(signature, "confirmed");
    setSuccess(true);
    onCreated?.();
  } catch (e: any) {
    setError(e.message || String(e));
  }
  setLoading(false);
}


  return (
    <div>
      <button onClick={handleCreateATA} disabled={loading || !publicKey || success}>
        {loading ? "Veido kontu..." : (success ? "ATA izveidots!" : "Izveidot token kontu (ATA)")}
      </button>
      {error && <div style={{ color: "red" }}>{error}</div>}
    </div>
  );
}