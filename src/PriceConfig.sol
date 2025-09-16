// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PriceConfig {
    uint256 public immutable deviationThreshold;
    uint256 public immutable baselinePrice;
    
    constructor(uint256 _deviationThreshold, uint256 _baselinePrice) {
        deviationThreshold = _deviationThreshold;
        baselinePrice = _baselinePrice;
    }
}

