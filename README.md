
# Price Deviation Trap

A Drosera trap project to detect and respond to price deviations on the Hoodi testnet.

## Project Overview

This repository documents the setup, deployment, and integration of a custom price deviation detection trap on the Hoodi Ethereum testnet. It highlights architectural decisions, solutions to challenges, and provides a comprehensive guide for replication.

My goal was to create a Drosera trap that monitors an on-chain price for significant "drift" and triggers an on-chain response when detected. This project demonstrates automated price monitoring using the Drosera protocol, implementing custom Solidity contracts with a focus on detecting percentage-based price deviations from a configurable baseline.

## Core Project Components

Here are the main smart contracts developed for this project:

### PriceMock.sol
A basic mock contract (`src/PriceMock.sol`) simulating an on-chain price feed. This contract serves as our data source and includes:
- `currentPrice`: Storage variable holding the current price value
- `updatePrice(uint256)`: Function to modify the price (owner only)
- `getPrice()`: Public function returning the current price
- Owner-based access control for price updates

For dynamic testing, this contract allows us to simulate real-world price movements by manually updating values.

### ITrap.sol
The standard Drosera interface (`src/interfaces/ITrap.sol`) that my main trap contracts implement. This interface defines:
- `collect()`: Function to gather data from external sources
- `shouldRespond(bytes[] memory)`: Pure function to determine if response is needed

The interface follows Drosera's strict requirements: no constructors allowed, and `shouldRespond` must be pure (no state reads).

### PriceDeviationTrap.sol
My core trap logic (`src/PriceDeviationTrap.sol`). This contract implements the complete monitoring and decision-making logic:

**Key Features:**
- **Stateless Design**: No constructor parameters (Drosera requirement)
- **Hardcoded Registry**: Uses constant address `TRAP_REGISTRY` for security
- **Pure Logic**: `shouldRespond()` function performs calculations without state reads

**collect() Function:**

**Mathematical Logic:**
- Baseline price: $100 (configurable)
- Deviation threshold: 10% (configurable)
- Trigger condition: `|(currentPrice - baselinePrice)| / baselinePrice * 100 >= deviationThreshold`
- Safe range: $90-$110 (no trigger)
- Danger range: <$90 or >$110 (triggers response)

### PriceConfig.sol
A separate contract (`src/PriceConfig.sol`) designed to hold immutable configuration parameters for my stateless trap:
- `deviationThreshold`: Percentage threshold for triggering (stored as uint256, e.g., 10 for 10%)
- `baselinePrice`: Reference price for deviation calculations (e.g., 100 for $100)
- Both values are immutable after deployment, ensuring consistent trap behavior

This separation allows the trap to remain stateless while accessing configuration data through the registry pattern.

### ResponseContract.sol
A contract (`src/ResponseContract.sol`) serving as the target for my trap's on-chain responses:

**Response Functions:**
- `handlePriceDeviation(string)`: Primary response function called by Drosera
- `respond(bytes)`: Alternative response function for encoded data
- Both functions emit `PriceDeviationDetected` events for monitoring

**Access Control:**
- `onlyOwner`: Restricts configuration functions to contract deployer
- `onlyDrosera`: Ensures only authorized Drosera address can trigger responses
- `setDroseraAddress()`: Allows owner to configure the authorized Drosera caller

### TrapRegistry.sol
A central registry contract (`src/TrapRegistry.sol`) that stores and provides updatable addresses for other key contracts:
- `priceConfigAddress`: Address of the PriceConfig contract
- `priceMockAddress`: Address of the PriceMock data source
- `setPriceConfig()`: Owner function to update configuration contract
- `setPriceMock()`: Owner function to update data source contract

This registry pattern enables flexible configuration for the `PriceDeviationTrap` without requiring redeployment of the main trap contract.

## Advanced Trap Architecture

The trap implements a sophisticated multi-contract architecture designed for modularity and upgradeability:

### Data Flow Architecture
```
PriceMock (Data) → TrapRegistry (Routing) → PriceConfig (Rules) → PriceDeviationTrap (Logic) → ResponseContract (Action)
```

### Execution Flow
1. **Data Collection Phase**: `collect()` queries TrapRegistry for current contract addresses
2. **Data Retrieval Phase**: Fetches current price from PriceMock and configuration from PriceConfig
3. **Data Encoding Phase**: Packages all required data using `abi.encode()`
4. **Analysis Phase**: `shouldRespond()` decodes data and performs deviation calculation
5. **Decision Phase**: Returns boolean trigger decision and optional response message
6. **Response Phase**: Drosera operator submits transaction to ResponseContract if triggered

### Mathematical Implementation
The trap implements precise percentage-based deviation detection:

```solidity
uint256 deviation = currentPrice > baselinePrice 
    ? currentPrice - baselinePrice 
    : baselinePrice - currentPrice;

uint256 deviationPercentage = (deviation * 100) / baselinePrice;

bool shouldTrigger = deviationPercentage >= deviationThreshold;
```

This approach handles both upward and downward price movements symmetrically.

### String Conversion Utility
The trap includes a custom `_uint2str()` function for converting numeric deviation percentages to human-readable strings in response messages. This utility performs efficient integer-to-string conversion without external dependencies.

## Comprehensive Testing of shouldRespond()

To ensure the robustness and reliability of my trap's core on-chain logic, I developed a comprehensive test suite covering:

### Test Scenarios
- **No Deviation**: Confirms `shouldRespond()` returns `false` when price is within acceptable range (±9% from baseline)
- **Upward Deviation**: Verifies `shouldRespond()` returns `true` for prices exceeding upper threshold
- **Downward Deviation**: Verifies `shouldRespond()` returns `true` for prices below lower threshold  
- **Boundary Testing**: Tests exact threshold values ($90, $110 for 10% threshold)
- **Edge Cases**: Handles zero prices, very high prices, and boundary conditions
- **Response Messages**: Validates correct deviation percentage reporting in response strings

### Mathematical Validation
The tests specifically validate the percentage calculation logic:
- 5% deviation ($95 or $105): No trigger expected
- 10% deviation ($90 or $110): Trigger expected at boundary
- 15% deviation ($85 or $115): Clear trigger expected
- Extreme cases (0% to 500% deviations): Proper handling verification

## Security Considerations

### Production Security Measures
- **Access Control**: All sensitive functions protected by `onlyOwner` or `onlyDrosera` modifiers
- **Hardcoded Addresses**: Critical contract addresses stored as constants to prevent manipulation
- **Pure Functions**: Core logic in `shouldRespond()` cannot be influenced by external state changes
- **Event Logging**: All responses emit events for audit trails and monitoring
- **Input Validation**: Proper bounds checking and error handling throughout

### Development Security Practices  
- **Private Key Management**: Sensitive keys stored in `.env` files for development (production requires HSM/key vaults)
- **Contract Verification**: All contracts deployed with source code verification on block explorers
- **Testing Coverage**: Comprehensive test suite covering edge cases and boundary conditions
- **Upgrade Patterns**: Registry system allows configuration updates without core logic redeployment

## Advanced Features and Optimizations

### Gas Optimization Techniques
- **Pure Functions**: `shouldRespond()` declared pure for optimal gas usage during Drosera evaluation
- **Efficient String Conversion**: Custom `_uint2str()` implementation avoids external library dependencies
- **Minimal Storage**: Configuration stored in separate immutable contract to reduce main trap storage costs
- **Batch Data Collection**: Single `collect()` call gathers all required data to minimize RPC calls

### Monitoring and Observability
- **Event Emission**: ResponseContract emits structured events for off-chain monitoring
- **Operator Integration**: Full compatibility with Drosera operator monitoring and alerting
- **Transaction Tracing**: All price updates and responses create auditable on-chain records
- **Real-time Alerts**: Event listeners can provide immediate notification of trap activations

### Extensibility Design
- **Modular Architecture**: Component separation allows individual contract upgrades
- **Configuration Flexibility**: Thresholds and targets easily modified via registry updates  
- **Multi-Asset Support**: Architecture supports monitoring multiple price feeds simultaneously
- **Custom Response Logic**: ResponseContract can be extended for complex response workflows

## Mathematical Precision and Edge Cases

### Precision Handling
The trap uses integer arithmetic with percentage calculations scaled by 100 to maintain precision:
- Deviation calculation: `|(current - baseline)| * 100 / baseline`
- Threshold comparison uses basis points equivalent (10% = 10)
- Avoids floating-point arithmetic for deterministic results across all EVM implementations

### Edge Case Management
- **Zero Baseline**: Protected against division by zero with require statements
- **Price Overflow**: Handles extremely large price values within uint256 bounds  
- **Rounding Behavior**: Integer division provides consistent floor-based deviation calculation
- **Negative Results**: Absolute value calculation prevents negative deviation percentages

## Conclusion

This project successfully demonstrates the implementation and deployment of a Drosera Price Deviation Trap, showcasing advanced smart contract architecture, mathematical precision, and production-ready security practices. The modular design, comprehensive testing, and detailed documentation provide a robust foundation for real-world automated monitoring applications.

The trap's sophisticated deviation detection logic, combined with Drosera's decentralized operator network, creates a powerful system for automated price monitoring that can scale to production environments with minimal modifications.
