pragma solidity 0.4.24;


import '../allocator/TokenAllocator.sol';

/// @title TokenAllocator
/// @author Applicature
/// @notice Contract responsible for defining distribution logic of tokens.
/// @dev Base class
contract TokenAllocatorTest is TokenAllocator {

    function tokensAvailable() public view returns (uint256){}

    function internalAllocate(address _holder, uint256 _tokens) internal onlyCrowdsale() {}
}

