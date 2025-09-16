// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/PriceDeviationTrap.sol";
import "../src/PriceConfig.sol";
import "../src/PriceMock.sol";
import "../src/TrapRegistry.sol";
import "../src/ResponseContract.sol";

contract PriceDeviationTrapTest is Test {
    PriceDeviationTrap public trap;
    PriceConfig public config;
    PriceMock public priceMock;
    TrapRegistry public registry;
    ResponseContract public responseContract;
    
    uint256 constant BASELINE_PRICE = 100;
    uint256 constant DEVIATION_THRESHOLD = 10; // 10%
    address constant EXPECTED_REGISTRY = 0x59891e755d0dc2F6f9C66F2e49c50DC7c810072e;
    
    function setUp() public {
        // Deploy contracts at expected addresses or use mock
        registry = new TrapRegistry();
        config = new PriceConfig(DEVIATION_THRESHOLD, BASELINE_PRICE);
        priceMock = new PriceMock(BASELINE_PRICE);
        
        // We need to deploy registry at the expected address for the trap to work
        // For testing, we'll use vm.etch to place the registry at the expected address
        vm.etch(EXPECTED_REGISTRY, address(registry).code);
        vm.store(EXPECTED_REGISTRY, 0, bytes32(uint256(uint160(address(this))))); // owner
        
        // Configure the registry at expected address
        TrapRegistry(EXPECTED_REGISTRY).setPriceConfig(address(config));
        TrapRegistry(EXPECTED_REGISTRY).setPriceMock(address(priceMock));
        
        // Deploy main trap (no constructor)
        trap = new PriceDeviationTrap();
        
        // Deploy response contract
        responseContract = new ResponseContract();
    }
    
    function testCollectFunction() public view {
        bytes memory collectOutput = trap.collect();
        (uint256 currentPrice, uint256 deviationThreshold, uint256 baselinePrice) = 
            abi.decode(collectOutput, (uint256, uint256, uint256));
        
        assertEq(currentPrice, BASELINE_PRICE);
        assertEq(deviationThreshold, DEVIATION_THRESHOLD);
        assertEq(baselinePrice, BASELINE_PRICE);
    }
    
    function testShouldRespondNoDrift() public {
        // Test price within acceptable range (5% deviation = 95-105)
        priceMock.updatePrice(95);
        
        bytes memory collectOutput = trap.collect();
        (bool shouldRespond,) = trap.shouldRespond(collectOutput);
        
        assertFalse(shouldRespond);
    }
    
    function testShouldRespondWithDriftLow() public {
        // Test price below threshold (15% deviation = $85)
        priceMock.updatePrice(85);
        
        bytes memory collectOutput = trap.collect();
        (bool shouldRespond, bytes memory responseData) = trap.shouldRespond(collectOutput);
        
        assertTrue(shouldRespond);
        string memory actualMessage = abi.decode(responseData, (string));
        assertEq(actualMessage, "Price deviation detected: 15% from baseline");
    }
    
    function testShouldRespondWithDriftHigh() public {
        // Test price above threshold (20% deviation = $120)
        priceMock.updatePrice(120);
        
        bytes memory collectOutput = trap.collect();
        (bool shouldRespond, bytes memory responseData) = trap.shouldRespond(collectOutput);
        
        assertTrue(shouldRespond);
        string memory actualMessage = abi.decode(responseData, (string));
        assertEq(actualMessage, "Price deviation detected: 20% from baseline");
    }
    
    function testShouldRespondAtThreshold() public {
        // Test price exactly at threshold (10% deviation = $90 or $110)
        priceMock.updatePrice(90);
        
        bytes memory collectOutput = trap.collect();
        (bool shouldRespond,) = trap.shouldRespond(collectOutput);
        
        assertTrue(shouldRespond); // Should trigger at exactly 10%
    }
    
    function testShouldRespondJustUnderThreshold() public {
        // Test price just under threshold (9% deviation = $91 or $109)
        priceMock.updatePrice(91);
        
        bytes memory collectOutput = trap.collect();
        (bool shouldRespond,) = trap.shouldRespond(collectOutput);
        
        assertFalse(shouldRespond); // Should not trigger at 9%
    }
    
    function testResponseContractAccess() public {
        // Test that only authorized addresses can call response functions
        vm.expectRevert("Only Drosera");
        responseContract.handlePriceDeviation("test message");
        
        // Set Drosera address and test successful call
        responseContract.setDroseraAddress(address(this));
        
        // Test successful call
        responseContract.handlePriceDeviation("test message");
    }
}
