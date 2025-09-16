// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TrapRegistry {
    address public priceConfigAddress;
    address public priceMockAddress;
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    function setPriceConfig(address _priceConfigAddress) external {
        require(msg.sender == owner, "Only owner");
        priceConfigAddress = _priceConfigAddress;
    }
    
    function setPriceMock(address _priceMockAddress) external {
        require(msg.sender == owner, "Only owner");
        priceMockAddress = _priceMockAddress;
    }
}
