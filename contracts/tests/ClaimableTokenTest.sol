pragma solidity ^0.4.0;


import '../token/ClaimableToken.sol';
import './IErc20Test.sol';
import '../Ownable.sol';


contract ClaimableTokenTest is ClaimableToken, IErc20Test, Ownable {


    function ClaimableTokenTest(uint256 _maxSupply) public IErc20Test(_maxSupply) {

    }

    function claim(address _holder, uint256 _tokens) public {
        transfer(_holder, _tokens);
    }

}

