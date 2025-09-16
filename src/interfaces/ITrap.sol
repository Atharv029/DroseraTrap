// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ITrap {
    function collect() external view returns (bytes memory);
    function shouldRespond(bytes[] memory) external pure returns (bool, bytes memory);
}
