pragma solidity 0.4.19;

import "../ICO.sol";
import "../contribution/DistributedDirectContributionForwarder.sol";
import "../pricing/TokenDateBonusTiersPricingStrategy.sol";
import "../allocator/MintableTokenAllocator.sol";


contract TestICO is ICO {

    function TestICO(
        MintableTokenAllocator _allocator,
        DistributedDirectContributionForwarder _contributionForwarder,
        TokenDateBonusTiersPricingStrategy _pricingStrategy
    ) public
        ICO(
            _allocator,
            _contributionForwarder,
            _pricingStrategy
        )
    { }


    function testChangeSoldTokens(uint256 _value) public {
        tokensSold = _value;
    }

    function testChangeState(Crowdsale.State _value) public {
        currentState = _value;
    }

    function testUpdateTierSoldTokens(uint256 _tokens) public {
        super.updateTierSoldTokens(_tokens);
    }

}
