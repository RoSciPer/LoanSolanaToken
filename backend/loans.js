// loans.js
// Ļoti vienkārša atmiņas datu bāze aizdevumu pārvaldībai - der testēšanai, bet ne ražošanai!

const loans = new Map();

// Reģistrē aizdevumu
function registerLoan(userPublicKey, amount, collateral, signature) {
  loans.set(userPublicKey, {
    amount,
    collateral,
    signature,
    issued_at: Date.now(),
    repaid: false
  });
}

// Atgriež lietotāja aktīvo aizdevumu
function getUserActiveLoan(userPublicKey) {
  const loan = loans.get(userPublicKey);
  if (!loan || loan.repaid) return null;
  return loan;
}

// Aizver aizdevumu, atzīmē kā atmaksātu
function closeLoan(userPublicKey, refundedAmount) {
  const loan = loans.get(userPublicKey);
  if (!loan) return;
  loan.repaid = true;
  loan.refundedAmount = refundedAmount;
  loan.closed_at = Date.now();
  loans.set(userPublicKey, loan);
}

// Sniedz atmaksas info (piemēram, cik jāmaksā un kāda mint adrese)
function getRepayInfo(userPublicKey) {
  const loan = getUserActiveLoan(userPublicKey);
  if (!loan) return null;
  return {
    amount: loan.amount,
    mint: process.env.TKN_MINT // var būt arī kāds mint PublicKey
  };
}

module.exports = { registerLoan, getUserActiveLoan, closeLoan, getRepayInfo }; 