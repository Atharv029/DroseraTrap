const { ethers } = require("ethers");
require("dotenv").config();

console.log("Testing connection...");
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
console.log("Wallet:", wallet.address);

wallet.getBalance().then(balance => {
    console.log("Balance:", ethers.formatEther(balance), "ETH");
}).catch(err => {
    console.error("Error:", err.message);
});
