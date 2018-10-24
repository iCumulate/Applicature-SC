pragma solidity ^0.4.24;

import '../ICUCrowdsale.sol';

contract ICUCrowdsaleTest is ICUCrowdsale {


    constructor(
        MintableTokenAllocator _allocator,
        DistributedDirectContributionForwarder _contributionForwarder,
        ICUStrategy _pricingStrategy,
        uint256 _startTime,
        uint256 _endTime
    ) public ICUCrowdsale(
        _allocator,
        _contributionForwarder,
        _pricingStrategy,
        _startTime,
        _endTime
    ) {

    }

    function updateUsdCollected(uint256 _usdCollected) public {
        usdCollected = _usdCollected;
    }

    function updateAvailableBonusAmount(uint256 _availableBonusAmount) public {
        availableBonusAmount = _availableBonusAmount;
    }

    function setFinalized() public {
        finalized = true;
    }

}
