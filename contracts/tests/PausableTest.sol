pragma solidity ^0.4.0;


import '../Pausable.sol';


contract PausableTest is Pausable {


    function PausableTest(bool _paused) public Pausable(_paused) {

    }

    function shouldBePaused() public isPaused(true) returns (bool) {
        return true;
    }

    function shouldBeUnPaused() public isPaused(false) returns (bool) {
        return true;
    }
}

