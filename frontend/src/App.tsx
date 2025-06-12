import React, { useMemo } from "react";
import { clusterApiUrl } from "@solana/web3.js";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";

import { LoanUI } from "./components/LoanUI";
import "./index.css";
import "@solana/wallet-adapter-react-ui/styles.css";

// Nolasām mint adresi no .env (vite atbalsta import.meta.env)
const TOKEN2022_MINT = import.meta.env.VITE_TOKEN2022_MINT as string;

export default function App() {
  const network = "devnet";
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <LoanUI mint={TOKEN2022_MINT} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}