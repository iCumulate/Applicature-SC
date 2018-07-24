pragma solidity ^0.4.23;

import './MintableToken.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol';


/// @title MintableBurnableToken
/// @author Applicature
/// @notice helper mixed to other contracts to burn tokens
/// @dev implementation
contract MintableBurnableToken is MintableToken, BurnableToken {

    mapping (address => bool) public burnAgents;

    modifier onlyBurnAgents () {
        require(burnAgents[msg.sender]);
        _;
    }

    event Burn(address indexed burner, uint256 value);

    constructor(
        uint256 _maxSupply,
        uint256 _mintedSupply,
        bool _allowedMinting
    ) public MintableToken(
        _maxSupply,
        _mintedSupply,
        _allowedMinting
    ) {

    }

    /// @notice update minting agent
    function updateBurnAgent(address _agent, bool _status) public onlyOwner {
        burnAgents[_agent] = _status;
    }

    function burnByAgent(address _holder, uint256 _tokensToBurn) public onlyBurnAgents() returns (uint256) {
        if (_tokensToBurn == 0) {
            _tokensToBurn = balanceOf(_holder);
        }
        _burn(_holder, _tokensToBurn);
        return _tokensToBurn;
    }

    function _burn(address _who, uint256 _value) internal {
        require(_value <= balances[_who]);
        // no need to require value <= totalSupply, since that would imply the
        // sender's balance is greater than the totalSupply, which *should* be an assertion failure

        balances[_who] = balances[_who].sub(_value);
        totalSupply_ = totalSupply_.sub(_value);
        maxSupply = maxSupply.sub(_value);
        emit Burn(_who, _value);
        emit Transfer(_who, address(0), _value);
    }
}
