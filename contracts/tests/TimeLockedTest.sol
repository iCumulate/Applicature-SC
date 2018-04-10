pragma solidity ^0.4.0;


import '../TimeLocked.sol';


contract TimeLockedTest is TimeLocked {


    function TimeLockedTest(uint256 _time) public TimeLocked(_time) {

    }

    function shouldBeLocked() public isTimeLocked(true) returns (bool) {
        return true;
    }

    function shouldBeUnLocked() public isTimeLocked(false) returns (bool) {
        return true;
    }

}

