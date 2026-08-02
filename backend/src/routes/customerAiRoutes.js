const express = require("express");
const { chatWithCustomerAi } = require("../controllers/customerAiController");

const router = express.Router();

router.post("/chat", chatWithCustomerAi);

module.exports = router;
