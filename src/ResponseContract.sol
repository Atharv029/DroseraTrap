pragma solidity ^0.8.0;

contract ResponseContract {
    address public owner;
    address public droseraAddress;
    
    event PriceDeviationDetected(string message, uint256 timestamp);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyDrosera() {
        require(msg.sender == droseraAddress, "Only Drosera");
        _;
    }
    
    function setDroseraAddress(address _droseraAddress) external onlyOwner {
        droseraAddress = _droseraAddress;
    }
    
    function handlePriceDeviation(string calldata message) external onlyDrosera {
        emit PriceDeviationDetected(message, block.timestamp);
    }
    
    function respond(bytes calldata data) external onlyDrosera {
        string memory message = abi.decode(data, (string));
        emit PriceDeviationDetected(message, block.timestamp);
    }
}
