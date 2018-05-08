pragma solidity 0.4.19;

import './ICO.sol';
import './token/MintableToken.sol';
import './pricing/TokenDateBonusTiersPricingStrategy.sol';

contract StatsContract {
    using SafeMath for uint256;

    MintableToken public token;
    ICO public crowdsale;
    TokenDateBonusTiersPricingStrategy public pricingStrategy;

    function StatsContract(
        MintableToken _token,
        ICO _crowdsale,
        TokenDateBonusTiersPricingStrategy _pricingStrategy
    ) public {
        token = _token;
        crowdsale = _crowdsale;
        pricingStrategy = _pricingStrategy;
    }

    function getStats() public view returns (
        uint256 start,
        uint256 end,
        uint256 sold,
        uint256 hard,
        uint256 soft,
        uint256 remainingBonuses,
        uint256[24] tiersData
    ) {
        start = crowdsale.startDate();
        end = crowdsale.endDate();
        sold = crowdsale.tokensSold();
        hard = crowdsale.hardCap();
        soft = crowdsale.softCap();
        remainingBonuses = crowdsale.bonusAmount();
        tiersData = pricingStrategy.getArrayOfTiers();
    }

}