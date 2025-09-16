// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PriceMock {
    uint256 public currentPrice;
    address public owner;
    
    constructor(uint256 _initialPrice) {
        currentPrice = _initialPrice;
        owner = msg.sender;
    }
    
    function updatePrice(uint256 _newPrice) external {
        require(msg.sender == owner, "Only owner can update");
        currentPrice = _newPrice;
    }
    
    function getPrice() external view returns (uint256) {
        return currentPrice;
    }
}
