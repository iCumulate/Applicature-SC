pragma solidity 0.4.24;

import './pricing/TokenDateCappedTiersPricingStrategy.sol';
import './ICUAgent.sol';


contract ICUStrategy is TokenDateCappedTiersPricingStrategy {

    ICUAgent public agent;

    event UnsoldTokensProcessed(uint256 fromTier, uint256 toTier, uint256 tokensAmount);

    constructor(
        uint256[] _emptyArray,
        uint256 _etherPriceInUSD
    ) public TokenDateCappedTiersPricingStrategy(
        _emptyArray,
        _emptyArray,
        18,
        _etherPriceInUSD
    ) {
        //Pre-ICO
        tiers.push(
            Tier(
                0.01e5,//tokenInUSD
                1000000000e18,//maxTokensCollected
                0,//soldTierTokens
                0,//bonusTierTokens
                0,//discountPercents
                uint256(20).mul(_etherPriceInUSD),//minInvestInUSD | 20 ethers
                1534507200,//startDate | 2018/08/17 12:00:00 UTC
                1535112000,//endDate | 2018/08/24 12:00:00 UTC
                false,
                _emptyArray
            )
        );
        //ICO
        tiers.push(
            Tier(
                0.01e5,//tokenInUSD
                1350000000e18,//maxTokensCollected
                0,//soldTierTokens
                0,//bonusTierTokens
                0,//discountPercents
                uint256(_etherPriceInUSD).div(10),//minInvestInUSD | 0.1 ether
                1535371200,//startDate | 2018/08/27	12:00:00 UTC
                1537185600,//endDate | 2018/09/17 12:00:00 UTC
                false,
                _emptyArray
            )
        );

        //Pre-ICO caps data
        tiers[0].capsData.push(1000000000e18);//cap $10,000,000 in tokens
        tiers[0].capsData.push(30);//bonus percents

        //ICO caps data
        tiers[1].capsData.push(400000000e18);//cap $4,000,000 in tokens
        tiers[1].capsData.push(20);//bonus percents

        tiers[1].capsData.push(800000000e18);//cap $4,000,000 in tokens
        tiers[1].capsData.push(10);//bonus percents

        tiers[1].capsData.push(1350000000e18);//cap $5,500,000 in tokens
        tiers[1].capsData.push(5);//bonus percents

    }

    function getArrayOfTiers() public view returns (uint256[14] tiersData) {
        uint256 j = 0;
        for (uint256 i = 0; i < tiers.length; i++) {
            tiersData[j++] = uint256(tiers[i].tokenInUSD);
            tiersData[j++] = uint256(tiers[i].maxTokensCollected);
            tiersData[j++] = uint256(tiers[i].soldTierTokens);
            tiersData[j++] = uint256(tiers[i].discountPercents);
            tiersData[j++] = uint256(tiers[i].minInvestInUSD);
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
            _tierId < tiers.length &&
            _capsData.length > 0 &&
            _capsData.length % 2 == 0
        );

        if (updateLockNeeded) {
            agent.updateLockPeriod(_end);
        }

        Tier storage tier = tiers[_tierId];
        tier.tokenInUSD = _price;
        tier.discountPercents = _discount;
        tier.minInvestInUSD = _minInvest;
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

            uint256 unsold = prevTier.maxTokensCollected.sub(prevTier.soldTierTokens);
            tier.maxTokensCollected = tier.maxTokensCollected.add(unsold);
            tier.capsData[0] = tier.capsData[0].add(unsold);

            emit UnsoldTokensProcessed(_tierId.sub(1), _tierId, unsold);
        }

        tier.soldTierTokens = tier.soldTierTokens.add(_soldTokens);
        tier.bonusTierTokens = tier.bonusTierTokens.add(_bonusTokens);
    }

    function getTierUnsoldTokens(uint256 _tierId) public view returns (uint256) {
        if (_tierId >= tiers.length || tiers[_tierId].unsoldProcessed) {
            return 0;
        }

        return tiers[_tierId].maxTokensCollected.sub(tiers[_tierId].soldTierTokens);
    }

    function getUnsoldTokens() public view returns (uint256 unsoldTokens) {
        for (uint256 i = 0; i < tiers.length; i++) {
            unsoldTokens += getTierUnsoldTokens(i);
        }
    }

    function getCapsData(uint256 _tierId) public view returns (uint256[]) {
        if (_tierId < tiers.length) {
            return tiers[_tierId].capsData;
        }
    }

}