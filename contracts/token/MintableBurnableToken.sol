pragma solidity ^0.4.18;


import './MintableToken.sol';


/// @title MintableBurnableToken
/// @author Applicature
/// @notice helper mixed to other contracts to burn tokens
/// @dev implementation
contract MintableBurnableToken is MintableToken {

    mapping (address => bool) public burnAgents;

    modifier onlyBurnAgents () {
        require(burnAgents[msg.sender]);
        _;
    }

    event Burn(address indexed burner, uint256 value);

    function MintableBurnableToken(
        uint256 _maxSupply,
        uint256 _mintedSupply,
        bool _allowedMinting
    ) public MintableToken(
        _maxSupply,
        _mintedSupply,
        _allowedMinting
    ) {}

    function burn(address _holder) public onlyBurnAgents() returns (uint256 balance) {
        balance = balances[_holder];
        balances[_holder] = 0;
        Burn(_holder, balance);
        Transfer(_holder, address(0), balance);
    }
}
