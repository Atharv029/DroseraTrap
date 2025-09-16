require("dotenv").config();
console.log("PRIVATE_KEY exists:", !!process.env.PRIVATE_KEY);
console.log("RPC_URL:", process.env.RPC_URL);
