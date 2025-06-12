# LoanSolanaToken
solana loan app. 


```mermaid
graph TD
    A[User] -->|Deposit 1 SOL| B(Loan Program)
    B -->|Mints 10M Tokens| A
    A -->|Early Repayment ≤60d| C[10M Tokens → 0.7 SOL]
    A -->|Late Repayment >60d| D[10M Tokens → 1.3 SOL]
    C --> B
    D --> B
```
## 🕒 Dynamic Repayment System

The protocol implements time-based incentives:

```rust
// Anchor program logic snippet
fn calculate_repayment(loan_age: u64) -> Result<u64> {
    const BASE_RATE: u64 = 1_000_000_000; // 1 SOL
    const EARLY_PENALTY: i64 = -300_000_000; // -0.3 SOL
    const LATE_BONUS: i64 = 300_000_000; // +0.3 SOL
    
    match loan_age.cmp(&SECONDS_PER_DAY * 60) {
        Ordering::Less => Ok((BASE_RATE as i64 + EARLY_BONUS) as u64),
        _ => Ok((BASE_RATE as i64 + LATE_PENALTY) as u64)
    }
}
