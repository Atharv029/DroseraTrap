const { ethers } = require("ethers");
require("dotenv").config();

async function test() {
    console.log("Testing connection...");
    
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log("Wallet:", wallet.address);
    
    try {
        const balance = await provider.getBalance(wallet.address);
        console.log("Balance:", ethers.formatEther(balance), "ETH");
        console.log("✅ Connection successful!");
        
        // Check if you have enough funds
        if (balance < ethers.parseEther("0.001")) {
            console.log("⚠️  Need more ETH from faucet: https://hoodi-faucet.pk910.de");
        }
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

test();
