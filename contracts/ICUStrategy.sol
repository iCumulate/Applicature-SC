pragma solidity ^0.4.24;

import './pricing/USDDateCappedTiersPricingStrategy.sol';
import './ICUAgent.sol';


contract ICUStrategy is USDDateCappedTiersPricingStrategy {

    ICUAgent public agent;

    constructor(
        uint256[] _tiers,
        uint256[]_capsData,
        uint256 _etherPriceInUSD
    ) public USDDateCappedTiersPricingStrategy(
        _tiers,
        _capsData,
        18,
        _etherPriceInUSD
    ) {}

    function getArrayOfTiers() public view returns (uint256[14] tiersData) {
        uint256 j = 0;
        for (uint256 i = 0; i < tiers.length; i++) {
            tiersData[j++] = uint256(tiers[i].tokenInUSD);
            tiersData[j++] = uint256(tiers[i].maxCollectedUSD);
            tiersData[j++] = uint256(tiers[i].soldTierTokens);
            tiersData[j++] = uint256(tiers[i].discountPercents);
            tiersData[j++] = uint256(tiers[i].minInvestInWei);
            tiersData[j++] = uint256(tiers[i].startDate);
            tiersData[j++] = uint256(tiers[i].endDate);
        }
    }

    function updateTier(
        uint256 _tierId,
        uint256 _start,
        uint256 _end,
        uint256 _minInvest,
        uint256 _price,
        uint256 _discount,
        uint256[] _capsData,
        bool updateLockNeeded
    ) public onlyOwner() {
        require(
            _start != 0 &&
            _price != 0 &&
            _start < _end &&
            _tierId < tiers.length
        );

        if (updateLockNeeded) {
            agent.updateLockPeriod(_end);
        }

        Tier storage tier = tiers[_tierId];
        tier.tokenInUSD = _price;
        tier.discountPercents = _discount;
        tier.minInvestInWei = _minInvest;
        tier.startDate = _start;
        tier.endDate = _end;
        tier.capsData = _capsData;
    }

    function setCrowdsaleAgent(ICUAgent _crowdsaleAgent) public onlyOwner {
        agent = _crowdsaleAgent;
    }

    function updateTierState(uint256 _tierId, uint256 _soldTokens, uint256 _bonusTokens) public {
        require(
            msg.sender == address(agent) &&
            _tierId < tiers.length &&
            _soldTokens > 0
        );

        Tier storage tier = tiers[_tierId];

        if (_tierId > 0 && !tiers[_tierId.sub(1)].unsoldProcessed) {
            Tier storage prevTier = tiers[_tierId.sub(1)];
            prevTier.unsoldProcessed = true;
            tier.maxCollectedUSD += prevTier.maxCollectedUSD.sub(prevTier.collectedUSD);
            tier.capsData[0] += prevTier.maxCollectedUSD.sub(prevTier.collectedUSD);
        }

        tier.soldTierTokens = tier.soldTierTokens.add(_soldTokens);
        tier.bonusTierTokens = tier.bonusTierTokens.add(_bonusTokens);
        tier.collectedUSD += getUSDAmountByTokens(_tierId, _soldTokens);
    }

    function getTierUnsoldTokens(uint256 _tierId) public view returns (uint256) {
        return getTokensAmountByUSD(_tierId, tiers[_tierId].maxCollectedUSD.sub(tiers[_tierId].collectedUSD));
    }

}