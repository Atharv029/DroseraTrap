// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/ITrap.sol";

contract PriceDeviationTrap is ITrap {
    address constant TRAP_REGISTRY = 0x59891e755d0dc2F6f9C66F2e49c50DC7c810072e;
    
    function collect() external view returns (bytes memory) {
        (bool success, bytes memory data) = TRAP_REGISTRY.staticcall(
            abi.encodeWithSignature("priceConfigAddress()")
        );
        require(success, "Registry call failed");
        address priceConfigAddr = abi.decode(data, (address));
        
        (success, data) = TRAP_REGISTRY.staticcall(
            abi.encodeWithSignature("priceMockAddress()")
        );
        require(success, "Registry call failed");
        address priceMockAddr = abi.decode(data, (address));
        
        (success, data) = priceConfigAddr.staticcall(
            abi.encodeWithSignature("deviationThreshold()")
        );
        require(success, "Config call failed");
        uint256 deviationThreshold = abi.decode(data, (uint256));
        
        (success, data) = priceConfigAddr.staticcall(
            abi.encodeWithSignature("baselinePrice()")
        );
        require(success, "Config call failed");
        uint256 baselinePrice = abi.decode(data, (uint256));
        
        (success, data) = priceMockAddr.staticcall(
            abi.encodeWithSignature("getPrice()")
        );
        require(success, "Price call failed");
        uint256 currentPrice = abi.decode(data, (uint256));
        
        return abi.encode(currentPrice, deviationThreshold, baselinePrice);
    }
    
    function shouldRespond(bytes[] memory collectOutputs) external pure returns (bool, bytes memory) {
        require(collectOutputs.length > 0, "No collect outputs");
        
        (uint256 currentPrice, uint256 deviationThreshold, uint256 baselinePrice) = 
            abi.decode(collectOutputs[0], (uint256, uint256, uint256));
        
        uint256 deviation;
        if (currentPrice > baselinePrice) {
            deviation = currentPrice - baselinePrice;
        } else {
            deviation = baselinePrice - currentPrice;
        }
        
        uint256 deviationPercentage = (deviation * 100) / baselinePrice;
        
        if (deviationPercentage >= deviationThreshold) {
            return (true, abi.encode("Price deviation detected"));
        }
        
        return (false, "");
    }
}
