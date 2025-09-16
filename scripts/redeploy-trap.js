const { ethers } = require("ethers");
const fs = require("fs");
require("dotenv").config();

async function main() {
    console.log("🔄 Redeploying PriceDeviationTrap...\n");
    
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log("👤 Deploying with:", wallet.address);
    
    try {
        // Load existing addresses
        const addresses = JSON.parse(fs.readFileSync("deployed-addresses.json"));
        console.log("📄 Loaded existing addresses");
        
        // Deploy new PriceDeviationTrap (no constructor)
        console.log("📦 Deploying new PriceDeviationTrap (no constructor)...");
        
        const trapData = JSON.parse(fs.readFileSync("out/PriceDeviationTrap.sol/PriceDeviationTrap.json"));
        
        // Create factory
        const PriceDeviationTrap = new ethers.ContractFactory(
            trapData.abi, 
            trapData.bytecode.object, 
            wallet
        );
        
        // Deploy with empty constructor (no arguments)
        console.log("🚀 Deploying...");
        const trap = await PriceDeviationTrap.deploy();
        
        console.log("⏳ Waiting for deployment...");
        await trap.waitForDeployment();
        
        const trapAddress = await trap.getAddress();
        addresses.priceDeviationTrap = trapAddress;
        
        console.log("✅ New PriceDeviationTrap:", trapAddress);
        
        // Update deployed addresses
        fs.writeFileSync('deployed-addresses.json', JSON.stringify(addresses, null, 2));
        console.log("📝 Updated deployed-addresses.json");
        
        // Update drosera.toml
        const droseraConfig = `ethereum_rpc = "${process.env.RPC_URL}"
drosera_rpc = "https://relay.hoodi.drosera.io"
eth_chain_id = 560048
drosera_address = "0x91cB447BaFc6e0EA0F4Fe056F5a9b1F14bb06e5D"

[traps.price_deviation_trap]
name = "Price Deviation Trap"
description = "Monitors price for significant deviations from baseline."
path = "out/PriceDeviationTrap.sol/PriceDeviationTrap.json"
response_contract = "${addresses.responseContract}"
response_function = "handlePriceDeviation(string)"
# address = "YOUR_TRAP_ADDRESS_AFTER_DROSERA_APPLY"
cooldown_period_blocks = 33
min_number_of_operators = 1
max_number_of_operators = 2
block_sample_size = 100
private_trap = true
whitelist = ["${wallet.address}"]
`;
        
        fs.writeFileSync('drosera.toml', droseraConfig);
        console.log("📝 Updated drosera.toml");
        
        console.log("\n🎉 === REDEPLOYMENT COMPLETE ===");
        console.log("All contract addresses:");
        console.log(JSON.stringify(addresses, null, 2));
        
    } catch (error) {
        console.error("❌ Redeployment failed:");
        console.error("Error:", error.message);
        console.error("Stack:", error.stack);
    }
}

main().catch(console.error);
