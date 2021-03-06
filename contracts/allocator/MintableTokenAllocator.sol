pragma solidity 0.4.24;


import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import './TokenAllocator.sol';
import '../token/erc20/MintableToken.sol';


/// @title MintableTokenAllocator
/// @author Applicature
/// @notice Contract responsible for defining distribution logic of tokens.
/// @dev implementation
contract MintableTokenAllocator is TokenAllocator {

    using SafeMath for uint256;

    MintableToken public token;

    constructor(MintableToken _token) public {
        require(address(0) != address(_token));
        token = _token;
    }

    /// @notice update instance of MintableToken
    function setToken(MintableToken _token) public onlyOwner {
        token = _token;
    }

    function internalAllocate(address _holder, uint256 _tokens) internal {
        token.mint(_holder, _tokens);
    }

    /// @notice Check whether contract is initialised
    /// @return true if initialized
    function isInitialized() public view returns (bool) {
        return token.mintingAgents(this);
    }

    /// @return available tokens
    function tokensAvailable() public view returns (uint256) {
        return token.availableTokens();
    }

}
