require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { loanRouter } = require("./controllers/loanController");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/loan", loanRouter);

app.get("/", (req, res) => {
  res.send("Solana loan backend is running!");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
