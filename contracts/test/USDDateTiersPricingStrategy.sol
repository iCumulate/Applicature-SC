pragma solidity ^0.4.23;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import '../pricing/PricingStrategy.sol';
import './USDExchange.sol';


/// @title USDDateTiersPricingStrategy
/// @author Applicature
/// @notice Contract is responsible for calculating tokens amount depending on price in USD
/// @dev implementation
contract USDDateTiersPricingStrategy is PricingStrategy, USDExchange {

    using SafeMath for uint256;

    struct Tier {
        uint256 tokenInUSD;
        uint256 maxTokensCollected;
        uint256 soldTierTokens;
        uint256 discountPercents;
        uint256 bonusPercents;
        uint256 minInvestInUSD;
        uint256 maxInvestInUSD;
        uint256 startDate;
        uint256 endDate;
        bool unsoldProcessed;
    }

    Tier[] public tiers;
    uint256 public decimals;

    constructor(uint256[] _tiers, uint256 _decimals, uint256 _etherPriceInUSD) public USDExchange(_etherPriceInUSD) {
        decimals = _decimals;
        trustedAddresses[msg.sender] = true;
        require(_tiers.length % 8 == 0);

        uint256 length = _tiers.length / 8;

        for (uint256 i = 0; i < length; i++) {
            tiers.push(
                Tier(
                    _tiers[i * 8], // tokenInUSD
                    _tiers[i * 8 + 1], // maxTokensCollected
                    0, //soldTierTokens
                    _tiers[i * 8 + 2], // discountPercents
                    _tiers[i * 8 + 3], // bonusPercents
                    _tiers[i * 8 + 4], // minInvestInUSD
                    _tiers[i * 8 + 5], // maxInvestInUSD
                    _tiers[i * 8 + 6], // startDate
                    _tiers[i * 8 + 7], // endDate
                    false
                )
            );
        }
    }

    /// @return tier index
    function getTierIndex() public view returns (uint256) {
        for (uint256 i = 0; i < tiers.length; i++) {
            if (
                block.timestamp >= tiers[i].startDate &&
                block.timestamp < tiers[i].endDate &&
                 (tiers[i].maxTokensCollected==0 || tiers[i].maxTokensCollected > tiers[i].soldTierTokens)
            ) {
                return i;
            }
        }

        return tiers.length;
    }

    function getActualTierIndex() public view returns (uint256) {
        for (uint256 i = 0; i < tiers.length; i++) {
            if (
                block.timestamp >= tiers[i].startDate
                && block.timestamp < tiers[i].endDate
                && (tiers[i].maxTokensCollected == 0 || tiers[i].maxTokensCollected > tiers[i].soldTierTokens)
                || block.timestamp < tiers[i].startDate
            ) {
                return i;
            }
        }

        return tiers.length.sub(1);
    }

    /// @return actual dates
    function getActualDates() public view returns (uint256 startDate, uint256 endDate) {
        uint256 tierIndex = getActualTierIndex();
        startDate = tiers[tierIndex].startDate;
        endDate = tiers[tierIndex].endDate;
    }

    /// @return tokens based on sold tokens and wei amount
    function getTokens(
        address _contributor,
        uint256 _tokensAvailable,
        uint256 _tokensSold,
        uint256 _weiAmount,
        uint256 _collectedWei
    ) public view returns (uint256 tokens, uint256 tokensExcludingBonus, uint256 bonus) {
        // disable compilation warnings because of unused variables
        _contributor = _contributor;
        _collectedWei = _collectedWei;
        _tokensSold = _tokensSold;

        if (_weiAmount == 0) {
            return (0, 0, 0);
        }

        uint256 tierIndex = getTierIndex();

        uint256 usdAmount = _weiAmount.mul(etherPriceInUSD);
        if (tierIndex < tiers.length
        && (usdAmount < tiers[tierIndex].minInvestInUSD.mul(1e18) && tiers[tierIndex].minInvestInUSD > 0)) {
            return (0, 0, 0);
        }

        if (tierIndex < tiers.length
        && (usdAmount > tiers[tierIndex].maxInvestInUSD.mul(1e18) && tiers[tierIndex].maxInvestInUSD > 0)) {
            return (0, 0, 0);
        }

        if (tierIndex == tiers.length) {
            return (0, 0, 0);
        }
        tokensExcludingBonus = usdAmount.div((getTokensInUSD(tierIndex))
            .mul(uint256(100).sub(getDiscount(tierIndex))).div(100));
        bonus = calculateBonusAmount(tierIndex, tokensExcludingBonus);
        tokens = tokensExcludingBonus.add(bonus);
        if (tiers[tierIndex].maxTokensCollected != 0
        && tiers[tierIndex].maxTokensCollected < tiers[tierIndex].soldTierTokens.add(tokens)) {
            return (0, 0, 0);
        }

        if (tokens > _tokensAvailable) {
            return (0, 0, 0);
        }
    }

    /// @return weis based on sold and required tokens
    function getWeis(
        uint256 _collectedWei,
        uint256 _tokensSold,
        uint256 _tokens
    ) public view returns (uint256 totalWeiAmount, uint256 tokensBonus) {
        // disable compilation warnings because of unused variables
        _collectedWei = _collectedWei;
        _tokensSold = _tokensSold;
        if (_tokens == 0) {
            return (0, 0);
        }

        uint256 tierIndex = getTierIndex();
        if (tierIndex == tiers.length) {
            return (0, 0);
        }
        if (tiers[tierIndex].maxTokensCollected != 0
        && tiers[tierIndex].maxTokensCollected < tiers[tierIndex].soldTierTokens.add(_tokens)) {
            return (0, 0);
        }
        uint256 usdAmount = _tokens.mul((getTokensInUSD(tierIndex))
        .mul(uint256(100).sub(getDiscount(tierIndex))).div(100));
        totalWeiAmount = usdAmount.div(etherPriceInUSD);

        if (tiers[tierIndex].minInvestInUSD > 0
        && totalWeiAmount < uint256(1 ether).mul(tiers[tierIndex].minInvestInUSD).div(etherPriceInUSD)) {
            return (0, 0);
        }
        if (tiers[tierIndex].maxInvestInUSD > 0
        && totalWeiAmount > uint256(1 ether).mul(tiers[tierIndex].maxInvestInUSD).div(etherPriceInUSD)) {
            return (0, 0);
        }

        tokensBonus = calculateBonusAmount(tierIndex, _tokens);

    }

    function getTokensInUSD(uint256 _tierIndex) public view returns (uint256) {
        if (_tierIndex < uint256(tiers.length)) {
            return tiers[_tierIndex].tokenInUSD;
        }
    }

    function getDiscount(uint256 _tierIndex) public view returns (uint256) {
        if (_tierIndex < uint256(tiers.length)) {
            return tiers[_tierIndex].discountPercents;
        }
    }

    function getBonusPercents(uint256 _tierIndex) public view returns (uint256) {
        if (_tierIndex < uint256(tiers.length)) {
            return tiers[_tierIndex].bonusPercents;
        }
    }

    function getMinEtherInvest(uint256 _tierIndex) public view returns (uint256) {
        if (_tierIndex < uint256(tiers.length)) {
            return tiers[_tierIndex].minInvestInUSD.mul(1 ether).div(etherPriceInUSD);
        }
    }

    function getUSDAmount(uint256 _weiAmount) public view returns (uint256) {
        return _weiAmount.mul(etherPriceInUSD).div(1 ether);
    }

    /// @notice Check whether contract is initialised
    /// @return true if initialized
    function isInitialized() public view returns (bool) {
        return true;
    }

    /// @notice updates tier start/end dates by id
    function updateDates(uint8 _tierId, uint256 _start, uint256 _end) public onlyOwner() {
        if (_start != 0 && _start < _end && _tierId < tiers.length) {
            Tier storage tier = tiers[_tierId];
            tier.startDate = _start;
            tier.endDate = _end;
        }
    }

    function calculateBonusAmount(uint256 _tierIndex, uint256 _tokens) public view returns (uint256 bonus) {
        return bonus = _tokens.mul(tiers[_tierIndex].bonusPercents).div(100);
    }

}

