import { PublicKey, Connection, Transaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

// Pārbaudi, vai lietotājam eksistē Token-2022 ATA
export async function checkLoanAta({
  connection,
  publicKey,
  mint,
}: {
  connection: Connection;
  publicKey: PublicKey;
  mint: string;
}) {
  const ata = await getAssociatedTokenAddress(
    new PublicKey(mint),
    publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );
  const info = await connection.getAccountInfo(ata);
  return !!info;
}

// Izveido Token-2022 ATA
export async function createLoanAta({
  connection,
  publicKey,
  sendTransaction,
  mint,
}: {
  connection: Connection;
  publicKey: PublicKey;
  sendTransaction: any;
  mint: string;
}) {
  const ata = await getAssociatedTokenAddress(
    new PublicKey(mint),
    publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );
  const ix = createAssociatedTokenAccountInstruction(
    publicKey,
    ata,
    publicKey,
    new PublicKey(mint),
    TOKEN_2022_PROGRAM_ID
  );
  const tx = new Transaction().add(ix);
  await sendTransaction(tx, connection);
}

// Pieprasa loan no backend
export async function requestLoan({
  connection,
  publicKey,
  sendTransaction,
  mint,
}: {
  connection: Connection;
  publicKey: PublicKey;
  sendTransaction: any;
  mint: string;
}) {
  // Šeit pieprasi loan no backend, pievieno mint parametru
  const res = await fetch("http://localhost:3001/take-loan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userPublicKey: publicKey.toBase58(), mint }),
  });
  if (!res.ok) throw new Error("Not get loan: " + (await res.text()));
  return res.json();
}