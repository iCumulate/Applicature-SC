pragma solidity ^0.4.23;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import './PricingStrategy.sol';
import './USDExchange.sol';


/// @title TokenDateCappedTiersPricingStrategy
/// @author Applicature
/// @notice Contract is responsible for calculating tokens amount depending on price in USD
/// @dev implementation
contract TokenDateCappedTiersPricingStrategy is PricingStrategy, USDExchange {

    using SafeMath for uint256;

    uint256 public capsAmount;

    struct Tier {
        uint256 tokenInUSD;
        uint256 maxTokensCollected;
        uint256 soldTierTokens;
        uint256 bonusTierTokens;
        uint256 discountPercents;
        uint256 minInvestInUSD;
        uint256 startDate;
        uint256 endDate;
        bool unsoldProcessed;
        uint256[] capsData;
    }

    Tier[] public tiers;
    uint256 public decimals;

    constructor(
        uint256[] _tiers,
        uint256[] _capsData,
        uint256 _decimals,
        uint256 _etherPriceInUSD
    ) public USDExchange(_etherPriceInUSD) {
        decimals = _decimals;
        trustedAddresses[msg.sender] = true;

        require(_tiers.length % 6 == 0);
        uint256 length = _tiers.length / 6;

        require(_capsData.length % length == 0);
        uint256 lengthCaps = _capsData.length / 2;

        uint256[] memory emptyArray;

        for (uint256 i = 0; i < length; i++) {
            tiers.push(
                Tier(
                    _tiers[i * 6],//tokenInUSD
                    _tiers[i * 6 + 1],//maxTokensCollected
                    0,//soldTierTokens
                    0,//bonusTierTokens
                    _tiers[i * 6 + 2],//discountPercents
                    _tiers[i * 6 + 3],//minInvestInUSD
                    _tiers[i * 6 + 4],//startDate
                    _tiers[i * 6 + 5],//endDate
                    false,
                    emptyArray//capsData
                )
            );

            for (uint256 j = 0; j < lengthCaps; j++) {
                tiers[i].capsData.push(_capsData[i * lengthCaps + j]);
            }
        }
    }

    /// @return tier index
    function getTierIndex() public view returns (uint256) {
        for (uint256 i = 0; i < tiers.length; i++) {
            if (
                block.timestamp >= tiers[i].startDate &&
                block.timestamp < tiers[i].endDate &&
                tiers[i].maxTokensCollected > tiers[i].soldTierTokens
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
                && tiers[i].maxTokensCollected > tiers[i].soldTierTokens
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

    function getTokensWithoutRestrictions(uint256 _weiAmount) public view returns (
        uint256 tokens,
        uint256 tokensExcludingBonus,
        uint256 bonus
    ) {
        if (_weiAmount == 0) {
            return (0, 0, 0);
        }

        uint256 tierIndex = getActualTierIndex();

        tokensExcludingBonus = _weiAmount.mul(etherPriceInUSD).div(getTokensInUSD(tierIndex));
        bonus = calculateBonusAmount(tierIndex, tokensExcludingBonus);
        tokens = tokensExcludingBonus.add(bonus);
    }

    /// @return tokens based on sold tokens and wei amount
    function getTokens(
        address,
        uint256 _tokensAvailable,
        uint256,
        uint256 _weiAmount,
        uint256
    ) public view returns (uint256 tokens, uint256 tokensExcludingBonus, uint256 bonus) {
        if (_weiAmount == 0) {
            return (0, 0, 0);
        }

        uint256 tierIndex = getTierIndex();
        if (tierIndex == tiers.length || _weiAmount.mul(etherPriceInUSD).div(1e18) < tiers[tierIndex].minInvestInUSD) {
            return (0, 0, 0);
        }

        uint256 usdAmount = _weiAmount.mul(etherPriceInUSD).div(1e18);

        tokensExcludingBonus = usdAmount.mul(1e18).div(getTokensInUSD(tierIndex));

        if (tiers[tierIndex].maxTokensCollected < tiers[tierIndex].soldTierTokens.add(tokensExcludingBonus)) {
            return (0, 0, 0);
        }

        bonus = calculateBonusAmount(tierIndex, tokensExcludingBonus);
        tokens = tokensExcludingBonus.add(bonus);

        if (tokens > _tokensAvailable) {
            return (0, 0, 0);
        }
    }

    /// @return weis based on sold and required tokens
    function getWeis(
        uint256,
        uint256,
        uint256 _tokens
    ) public view returns (uint256 totalWeiAmount, uint256 tokensBonus) {
        // disable compilation warnings because of unused variables
        if (_tokens == 0) {
            return (0, 0);
        }

        uint256 tierIndex = getTierIndex();
        if (tierIndex == tiers.length) {
            return (0, 0);
        }
        if (tiers[tierIndex].maxTokensCollected < tiers[tierIndex].soldTierTokens.add(_tokens)) {
            return (0, 0);
        }
        uint256 usdAmount = _tokens.mul(getTokensInUSD(tierIndex)).div(1e18);
        totalWeiAmount = usdAmount.mul(1e18).div(etherPriceInUSD);

        if (totalWeiAmount < uint256(1 ether).mul(tiers[tierIndex].minInvestInUSD).div(etherPriceInUSD)) {
            return (0, 0);
        }

        tokensBonus = calculateBonusAmount(tierIndex, _tokens);
    }

    function calculateBonusAmount(uint256 _tierIndex, uint256 _tokens) public view returns (uint256 bonus) {
        uint256 length = tiers[_tierIndex].capsData.length.div(2);

        uint256 remainingTokens = _tokens;
        uint256 newSoldTokens = tiers[_tierIndex].soldTierTokens;

        for (uint256 i = 0; i < length; i++) {
            if (newSoldTokens.add(remainingTokens) <= tiers[_tierIndex].capsData[i.mul(2)]) {
                bonus += remainingTokens.mul(tiers[_tierIndex].capsData[i.mul(2).add(1)]).div(100);
                break;
            } else {
                uint256 diff = tiers[_tierIndex].capsData[i.mul(2)].sub(newSoldTokens);
                remainingTokens -= diff;
                newSoldTokens += diff;
                bonus += diff.mul(tiers[_tierIndex].capsData[i.mul(2).add(1)]).div(100);
            }
        }
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
}

