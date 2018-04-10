pragma solidity ^0.4.18;

import '../../../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol';
import './IErc20.sol';
import '../../TimeLocked.sol';

/// @title TimeLockedToken
/// @author Applicature
/// @notice helper mixed to other contracts to lock contract on a timestamp
/// @dev Base class
contract TimeLockedToken is TimeLocked, IErc20 {
    function transfer(address _to, uint256 _tokens) public isTimeLocked(false) returns (bool) {
        super.transfer(_to, _tokens);
    }

    function transferFrom(address _holder, address _to, uint256 _tokens) public isTimeLocked(false) returns (bool) {
        super.transferFrom(_holder, _to, _tokens);
    }
}
