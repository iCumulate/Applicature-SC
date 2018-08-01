pragma solidity 0.4.24;

import './allocator/MintableTokenAllocator.sol';
import './token/erc20/MintableToken.sol';
import './ICUStrategy.sol';
import './ICUCrowdsale.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

contract Stats {

    using SafeMath for uint256;

    MintableToken public token;
    MintableTokenAllocator public allocator;
    ICUCrowdsale public crowdsale;
    ICUStrategy public pricing;

    constructor(
        MintableToken _token,
        MintableTokenAllocator _allocator,
        ICUCrowdsale _crowdsale,
        ICUStrategy _pricing
    ) public {
        token = _token;
        allocator = _allocator;
        crowdsale = _crowdsale;
        pricing = _pricing;
    }

    function getTokens(
        uint256,
        uint256 _weiAmount
    ) public view returns (uint256 tokens, uint256 tokensExcludingBonus, uint256 bonus) {
        return pricing.getTokens(address(0), allocator.tokensAvailable(), 0, _weiAmount, 0);
    }

    function getWeis(
        uint256,
        uint256 _tokenAmount
    ) public view returns (uint256 totalWeiAmount, uint256 tokensBonus) {
        return pricing.getWeis(0, 0, _tokenAmount);
    }

    function getStats(uint256 _userType, uint256[7] _ethPerCurrency) public view returns (
        uint256[7] stats,
        uint256[26] tiersData,
        uint256[21] currencyContr //tokensPerEachCurrency,
    ) {
        stats = getStatsData(_userType);
        tiersData = getTiersData(_userType);
        currencyContr = getCurrencyContrData(_userType, _ethPerCurrency);
    }

    function getTiersData(uint256) public view returns (
        uint256[26] tiersData
    ) {
        uint256[14] memory tiers = pricing.getArrayOfTiers();
        uint256 tierElements = tiers.length.div(2);
        uint256 j = 0;
        for (uint256 i = 0; i <= tierElements; i += tierElements) {
            tiersData[j++] = uint256(1e23).div(tiers[i]);// tokenInUSD;
            tiersData[j++] = 0;// tokenInWei;
            tiersData[j++] = uint256(tiers[i.add(1)]);// maxTokensCollected;
            tiersData[j++] = uint256(tiers[i.add(2)]);// soldTierTokens;
            tiersData[j++] = 0;// discountPercents;
            tiersData[j++] = 0;// bonusPercents;
            tiersData[j++] = uint256(tiers[i.add(4)]);// minInvestInUSD;
            tiersData[j++] = 0;// minInvestInWei;
            tiersData[j++] = 0;// maxInvestInUSD;
            tiersData[j++] = 0;// maxInvestInWei;
            tiersData[j++] = uint256(tiers[i.add(5)]);// startDate;
            tiersData[j++] = uint256(tiers[i.add(6)]);// endDate;
            tiersData[j++] = 1;
        }

        tiersData[25] = 2;
    }

    function getStatsData(uint256 _type) public view returns (
        uint256[7] stats
    ) {
        _type = _type;
        stats[0] = token.maxSupply();
        stats[1] = token.totalSupply();
        stats[2] = crowdsale.maxSaleSupply();
        stats[3] = crowdsale.tokensSold();
        stats[4] = uint256(crowdsale.currentState());
        stats[5] = pricing.getTierIndex();
        stats[6] = pricing.getMinEtherInvest(stats[5]);
    }

    function getCurrencyContrData(uint256 _type, uint256[7] _ethPerCurrency) public view returns (
        uint256[21] currencyContr
    ) {
        _type = _type;
        uint256 j = 0;
        for (uint256 i = 0; i < _ethPerCurrency.length; i++) {
            (currencyContr[j++], currencyContr[j++], currencyContr[j++]) = pricing.getTokensWithoutMinInvest(
                _ethPerCurrency[i],
                allocator.tokensAvailable()
            );
        }
    }

}
