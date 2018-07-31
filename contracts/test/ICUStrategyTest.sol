pragma solidity ^0.4.24;

import '../ICUStrategy.sol';


contract ICUStrategyTest is ICUStrategy {

    constructor(
        uint256[] _tiers,
        uint256[]_capsData,
        uint256 _etherPriceInUSD
    ) public ICUStrategy(_tiers, _capsData, _etherPriceInUSD) {

    }

    function updateSoldTokens(uint256 _tierId, uint256 _sold) public {
        Tier storage tier = tiers[_tierId];
        tier.collectedUSD = _sold;
    }

}