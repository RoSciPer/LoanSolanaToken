import React, { useState } from "react";

interface TakeLoanButtonProps {
  onTakeLoan: () => Promise<void>;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function TakeLoanButton({ onTakeLoan, disabled, style }: TakeLoanButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    setLoading(true);
    try {
      await onTakeLoan();
    } catch (e: any) {
      setError(e.message ?? String(e));
    }
    setLoading(false);
  };

  return (
    <div style={style}>
      <button onClick={handleClick} disabled={disabled || loading}>
        {loading ? "Take Loan..." : "Take Loan"}
      </button>
      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
    </div>
  );
}