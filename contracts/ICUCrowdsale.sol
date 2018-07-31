pragma solidity 0.4.24;

import './allocator/MintableTokenAllocator.sol';
import './crowdsale/RefundableCrowdsale.sol';
import './contribution/DistributedDirectContributionForwarder.sol';
import './ICUStrategy.sol';


contract ICUCrowdsale is RefundableCrowdsale {

    ICUStrategy public pricingStrategy;

    uint256 public constant PRE_ICO_TIER = 0;

    uint256 public maxSaleSupply = 2350000000e18;

    uint256 public bonusAmount = 400500000e18;

    uint256 public usdCollected;

    mapping(address => uint256) public contributorBonuses;
event Debug(string n, uint256 v);
    constructor(
        MintableTokenAllocator _allocator,
        DistributedDirectContributionForwarder _contributionForwarder,
        ICUStrategy _pricingStrategy,
        uint256 _startTime,
        uint256 _endTime
    ) public RefundableCrowdsale(
        _allocator,
        _contributionForwarder,
        _pricingStrategy,
        _startTime,
        _endTime,
        true,
        true,
        false,
        5000000e5, //softCap
        23500000e5//hardCap
    ) {
        pricingStrategy = _pricingStrategy;
        contributionForwarder = _contributionForwarder;
    }

    function updateState() public {
        (startDate, endDate) = pricingStrategy.getActualDates();
        super.updateState();
    }

    function claimBonuses() public {
        require(isSoftCapAchieved(0) && contributorBonuses[msg.sender] > 0);

        uint256 bonus = contributorBonuses[msg.sender];
        contributorBonuses[msg.sender] = 0;
        allocator.allocate(msg.sender, bonus);
    }

    function isHardCapAchieved(uint256 _value) public view returns (bool) {
        if (hardCap <= usdCollected.add(_value)) {
            return true;
        }
        return false;
    }

    function isSoftCapAchieved(uint256 _value) public view returns (bool) {
        if (softCap <= usdCollected.add(_value)) {
            return true;
        }
        return false;
    }

    function internalContribution(address _contributor, uint256 _wei) internal {
        updateState();

        require(currentState == State.InCrowdsale);

        uint256 usdAmount = pricingStrategy.getUSDAmount(_wei);

        require(!isHardCapAchieved(usdAmount.sub(1)));

        uint256 tokensAvailable = allocator.tokensAvailable();
        uint256 collectedWei = contributionForwarder.weiCollected();
        uint256 tierIndex = pricingStrategy.getTierIndex();
        uint256 tokens;
        uint256 tokensExcludingBonus;
        uint256 bonus;

        (tokens, tokensExcludingBonus, bonus) = pricingStrategy.getTokens(
            _contributor, tokensAvailable, tokensSold, _wei, collectedWei);

        require(tokens > 0);

        tokensSold = tokensSold.add(tokens);

        allocator.allocate(_contributor, tokensExcludingBonus);

        if (isSoftCapAchieved(0)) {
            if (msg.value > 0) {
                contributionForwarder.forward.value(address(this).balance)();
            }
        } else {
            // store contributor if it is not stored before
            if (contributorsWei[_contributor] == 0) {
                contributors.push(_contributor);
            }
            contributorsWei[_contributor] = contributorsWei[_contributor].add(msg.value);
        }

        usdCollected = usdCollected.add(usdAmount);

        if (bonusAmount > 0) {
            if (bonusAmount >= bonus) {
                bonusAmount = bonusAmount.sub(bonus);
            } else {
                bonus = bonusAmount;
                bonusAmount = 0;
            }
            contributorBonuses[_contributor] = contributorBonuses[_contributor].add(bonus);
        } else {
            bonus = 0;
        }

        crowdsaleAgent.onContribution(pricingStrategy, tierIndex, tokensExcludingBonus, bonus);

        emit Contribution(_contributor, _wei, tokensExcludingBonus, bonus);
    }

}
