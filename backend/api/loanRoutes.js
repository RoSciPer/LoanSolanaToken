const express = require("express");
const router = express.Router();
const {
  checkAta,
  initiateLoan,
  takeLoan,
  repayInfo,
  repayLoan,
  getLoanStatus
} = require("../controllers/loanController");

router.post("/check-ata", checkAta);
router.post("/initiate", initiateLoan);
router.post("/take", takeLoan);
router.post("/repay-info", repayInfo);
router.post("/repay", repayLoan);
router.get("/status/:user", getLoanStatus);

module.exports = { loanRouter: router };
