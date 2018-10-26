pragma solidity 0.4.25;


import './USDExchange.sol';


contract USDExchangeTest is USDExchange {


    constructor(uint256 _etherPriceInUSD) public USDExchange(_etherPriceInUSD) {
    }
    
    function parseIntTest(string _a, uint _b) public pure returns (uint) {
        return parseInt(_a, _b);
    }
}