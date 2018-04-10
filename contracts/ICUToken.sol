pragma solidity 0.4.19;


import "./token/erc20/openzeppelin/OpenZeppelinERC20.sol";
//import "./token/erc20/Erc20PausableToken.sol";
//import "./token/erc20/IErc20.sol";
//import "./token/MintableToken.sol";


contract ICUToken is OpenZeppelinERC20 {


    function ICUToken()
        public OpenZeppelinERC20(0, "iCumulate", 18, "ICU", false) {

    }

}
