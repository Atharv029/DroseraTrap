const { ethers } = require("ethers");
const fs = require("fs");
require("dotenv").config();

async function main() {
    console.log("🚀 Starting deployment...\n");
    
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log("👤 Deploying with:", wallet.address);
    
    const balance = await provider.getBalance(wallet.address);
    console.log("💰 Balance:", ethers.formatEther(balance), "ETH\n");
    
    const deployedAddresses = {};
    
    try {
        // 1. Deploy TrapRegistry
        console.log("📦 Deploying TrapRegistry...");
        const registryData = JSON.parse(fs.readFileSync("out/TrapRegistry.sol/TrapRegistry.json"));
        const TrapRegistry = new ethers.ContractFactory(registryData.abi, registryData.bytecode.object, wallet);
        const trapRegistry = await TrapRegistry.deploy();
        await trapRegistry.waitForDeployment();
        deployedAddresses.trapRegistry = await trapRegistry.getAddress();
        console.log("✅ TrapRegistry:", deployedAddresses.trapRegistry);
        
        // 2. Deploy PriceConfig (10% threshold, $100 baseline)
        console.log("📦 Deploying PriceConfig...");
        const configData = JSON.parse(fs.readFileSync("out/PriceConfig.sol/PriceConfig.json"));
        const PriceConfig = new ethers.ContractFactory(configData.abi, configData.bytecode.object, wallet);
        const priceConfig = await PriceConfig.deploy(10, 100);
        await priceConfig.waitForDeployment();
        deployedAddresses.priceConfig = await priceConfig.getAddress();
        console.log("✅ PriceConfig:", deployedAddresses.priceConfig);
        
        // 3. Deploy PriceMock ($100 initial price)
        console.log("📦 Deploying PriceMock...");
        const mockData = JSON.parse(fs.readFileSync("out/PriceMock.sol/PriceMock.json"));
        const PriceMock = new ethers.ContractFactory(mockData.abi, mockData.bytecode.object, wallet);
        const priceMock = await PriceMock.deploy(100);
        await priceMock.waitForDeployment();
        deployedAddresses.priceMock = await priceMock.getAddress();
        console.log("✅ PriceMock:", deployedAddresses.priceMock);
        
        // 4. Configure TrapRegistry
        console.log("⚙️  Configuring TrapRegistry...");
        await trapRegistry.setPriceConfig(deployedAddresses.priceConfig);
        await trapRegistry.setPriceMock(deployedAddresses.priceMock);
        console.log("✅ TrapRegistry configured");
        
        // 5. Deploy PriceDeviationTrap
        console.log("📦 Deploying PriceDeviationTrap...");
        const trapData = JSON.parse(fs.readFileSync("out/PriceDeviationTrap.sol/PriceDeviationTrap.json"));
        const PriceDeviationTrap = new ethers.ContractFactory(trapData.abi, trapData.bytecode.object, wallet);
        const trap = await PriceDeviationTrap.deploy(deployedAddresses.trapRegistry);
        await trap.waitForDeployment();
        deployedAddresses.priceDeviationTrap = await trap.getAddress();
        console.log("✅ PriceDeviationTrap:", deployedAddresses.priceDeviationTrap);
        
        // 6. Deploy ResponseContract
        console.log("📦 Deploying ResponseContract...");
        const responseData = JSON.parse(fs.readFileSync("out/ResponseContract.sol/ResponseContract.json"));
        const ResponseContract = new ethers.ContractFactory(responseData.abi, responseData.bytecode.object, wallet);
        const responseContract = await ResponseContract.deploy();
        await responseContract.waitForDeployment();
        deployedAddresses.responseContract = await responseContract.getAddress();
        console.log("✅ ResponseContract:", deployedAddresses.responseContract);
        
        // Save addresses
        fs.writeFileSync('deployed-addresses.json', JSON.stringify(deployedAddresses, null, 2));
        
        // Create drosera.toml
        const droseraConfig = `ethereum_rpc = "${process.env.RPC_URL}"
drosera_rpc = "https://relay.hoodi.drosera.io"
eth_chain_id = 560048
drosera_address = "0x91cB447BaFc6e0EA0F4Fe056F5a9b1F14bb06e5D"

[traps.price_deviation_trap]
name = "Price Deviation Trap"
description = "Monitors price for significant deviations from baseline."
path = "out/PriceDeviationTrap.sol/PriceDeviationTrap.json"
response_contract = "${deployedAddresses.responseContract}"
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
        
        console.log("\n🎉 === DEPLOYMENT COMPLETE ===");
        console.log("TrapRegistry:", deployedAddresses.trapRegistry);
        console.log("PriceConfig:", deployedAddresses.priceConfig);
        console.log("PriceMock:", deployedAddresses.priceMock);
        console.log("PriceDeviationTrap:", deployedAddresses.priceDeviationTrap);
        console.log("ResponseContract:", deployedAddresses.responseContract);
        console.log("\n📝 Files created:");
        console.log("- deployed-addresses.json");
        console.log("- drosera.toml");
        
    } catch (error) {
        console.error("❌ Deployment failed:", error);
    }
}

main().catch(console.error);
