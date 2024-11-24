const express = require("express");
const {
  writeEmailQuery,
  runEmailQuery,
  orchestrateResponse,
  test
} = require("../controllers/emailController");
const { isAuthenticated } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/writeEmailQuery", isAuthenticated, writeEmailQuery);
router.post("/runEmailQuery",isAuthenticated,  runEmailQuery)
router.post("/orchestrateResponse", isAuthenticated, orchestrateResponse)
router.post("/test", test)

module.exports = router;
