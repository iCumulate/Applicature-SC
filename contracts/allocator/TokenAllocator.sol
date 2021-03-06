pragma solidity 0.4.24;


import '../Ownable.sol';


/// @title TokenAllocator
/// @author Applicature
/// @notice Contract responsible for defining distribution logic of tokens.
/// @dev Base class
contract TokenAllocator is Ownable {


    mapping(address => bool) public crowdsales;

    modifier onlyCrowdsale() {
        require(crowdsales[msg.sender]);
        _;
    }

    function addCrowdsales(address _address) public onlyOwner {
        crowdsales[_address] = true;
    }

    function removeCrowdsales(address _address) public onlyOwner {
        crowdsales[_address] = false;
    }

    function isInitialized() public view returns (bool) {
        return false;
    }

    function allocate(address _holder, uint256 _tokens) public onlyCrowdsale() {
        internalAllocate(_holder, _tokens);
    }

    function tokensAvailable() public view returns (uint256);

    function internalAllocate(address _holder, uint256 _tokens) internal onlyCrowdsale();
}

