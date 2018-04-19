pragma solidity 0.4.19;


import "./token/erc20/Erc20PausableToken.sol";
import "./token/erc20/openzeppelin/OpenZeppelinERC20.sol";
import "./token/MintableToken.sol";


contract ICUToken is Erc20PausableToken, OpenZeppelinERC20, MintableToken {

    function ICUToken() public
        Erc20PausableToken(true)
        OpenZeppelinERC20(0, "iCumulate", 18, "ICU", false)
        MintableToken(uint256(4700000000).mul(10 ** 18), 0, true) {}
}
