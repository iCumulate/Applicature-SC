pragma solidity 0.4.25;

import '../crowdsale/CrowdsaleImpl.sol';


contract CrowdsaleImplTest is CrowdsaleImpl {

    constructor(
        TokenAllocator _allocator,
        ContributionForwarder _contributionForwarder,
        PricingStrategy _pricingStrategy,
        uint256 _startDate,
        uint256 _endDate,
        bool _allowWhitelisted,
        bool _allowSigned,
        bool _allowAnonymous
    ) public CrowdsaleImpl(
        _allocator,
        _contributionForwarder,
        _pricingStrategy,
        _startDate,
        _endDate,
        _allowWhitelisted,
        _allowSigned,
        _allowAnonymous
    ) {

    }

    function updateStartDate(uint256 _startDate) public {
        startDate = _startDate;
    }

    function updateSoldTokens(uint256 _tokensSold) public {
        tokensSold = _tokensSold;
    }

    function internalContributionTest(address _contributor, uint256 _wei) public payable {
        internalContribution(_contributor, _wei);
    }

    function setFinalized() public {
        finalized = true;
    }

}