pragma solidity ^0.4.24;

import '../ICUStrategy.sol';


contract ICUStrategyTest is ICUStrategy {

    constructor(
        uint256[] _emptyArray,
        uint256 _etherPriceInUSD
    ) public ICUStrategy(_emptyArray, _etherPriceInUSD) {

    }

    function updateSoldTokens(uint256 _tierId, uint256 _sold) public {
        Tier storage tier = tiers[_tierId];
        tier.soldTierTokens = _sold;
    }

}