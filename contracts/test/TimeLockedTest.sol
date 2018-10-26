pragma solidity 0.4.24;


import '../token/erc20/TimeLocked.sol';


contract TimeLockedTest is TimeLocked {


    constructor(uint256 _time) public TimeLocked(_time) {

    }

    function shouldBeLocked() public isTimeLocked(msg.sender, true) returns (bool) {
        return true;
    }

    function shouldBeUnLocked() public isTimeLocked(msg.sender, false) returns (bool) {
        return true;
    }

    function updateExcludedAddress(address, bool) public {}

}

