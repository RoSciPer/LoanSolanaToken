const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api/loan";

// 1. Pārbauda, vai lietotājam ir Token-2022 ATA
export async function checkATA(userPublicKey: string) {
  const res = await fetch(`${API_URL}/check-ata`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userPublicKey }),
  });
  return res.json();
}

// 2. Saņem ķīlas info no backend
export async function initiateLoan(userPublicKey: string) {
  const res = await fetch(`${API_URL}/initiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userPublicKey }),
  });
  return res.json();
}

// 3. Pēc ķīlas pārskaitījuma paziņo backend
export async function takeLoan(userPublicKey: string, collateralSignature: string) {
  const res = await fetch(`${API_URL}/take`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userPublicKey, collateralSignature }),
  });
  return res.json();
}

// 4. Pēc tokenu pārskaitījuma paziņo backend
export async function repayLoan(userPublicKey: string, repaySignature: string) {
  const res = await fetch(`${API_URL}/repay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userPublicKey, repaySignature }),
  });
  return res.json();
}

// 5. Saņem loan statusu
export async function getLoanStatus(userPublicKey: string) {
  const res = await fetch(`${API_URL}/status/${userPublicKey}`);
  return res.json();
}

// 6. 💡 JAUNS! Saņem atmaksas info (kur un cik maksāt)
export async function getRepayInfo(userPublicKey: string) {
  const res = await fetch(`${API_URL}/repay-info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userPublicKey }),
  });
  return res.json();
}
