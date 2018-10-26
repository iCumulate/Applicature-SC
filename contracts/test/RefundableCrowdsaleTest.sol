pragma solidity 0.4.25;

import '../crowdsale/RefundableCrowdsale.sol';


contract RefundableCrowdsaleTest is RefundableCrowdsale {

    constructor(
        TokenAllocator _allocator,
        ContributionForwarder _contributionForwarder,
        PricingStrategy _pricingStrategy,
        uint256 _startDate,
        uint256 _endDate,
        bool _allowWhitelisted,
        bool _allowSigned,
        bool _allowAnonymous,
        uint256 _softCap,
        uint256 _hardCap
    ) public RefundableCrowdsale(
        _allocator,
        _contributionForwarder,
        _pricingStrategy,
        _startDate,
        _endDate,
        _allowWhitelisted, 
        _allowSigned,
        _allowAnonymous,
        _softCap,
        _hardCap
    ) {

    }

    function updateEndDate(uint256 _endDate) public {
        endDate = _endDate;
    }

    function updateSoldTokens(uint256 _tokensSold) public {
        tokensSold = _tokensSold;
    }

    function internalContributionTest(address _contributor, uint256 _wei) public payable {
        internalContribution(_contributor, _wei);
    }

    function internalRefundTest(address _holder) public {
        internalRefund(_holder);
    }
}