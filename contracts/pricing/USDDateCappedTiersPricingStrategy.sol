pragma solidity ^0.4.23;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import './PricingStrategy.sol';
import './USDExchange.sol';


/// @title USDDateTiersPricingStrategy
/// @author Applicature
/// @notice Contract is responsible for calculating tokens amount depending on price in USD
/// @dev implementation
contract USDDateCappedTiersPricingStrategy is PricingStrategy, USDExchange {

    using SafeMath for uint256;

    uint256 public capsAmount;

    struct Tier {
        uint256 tokenInUSD;
        uint256 maxCollectedUSD;
        uint256 collectedUSD;
        uint256 soldTierTokens;
        uint256 bonusTierTokens;
        uint256 discountPercents;
        uint256 minInvestInWei;
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
        uint256 lengthCaps = _capsData.length / 2;
        uint256[] memory capsData;

        for (uint256 i = 0; i < length; i++) {
            tiers.push(
                Tier(
                    _tiers[i * 6],//tokenInUSD
                    _tiers[i * 6 + 1],//maxCollectedUSD
                    0,//collectedUSD
                    0,//soldTierTokens
                    0,//bonusTierTokens
                    _tiers[i * 6 + 2],//discountPercents
                    _tiers[i * 6 + 3],//minInvestInUSD
                    _tiers[i * 6 + 4],//startDate
                    _tiers[i * 6 + 5],//endDate
                    false,
                    capsData//capsData
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
                tiers[i].maxCollectedUSD > tiers[i].collectedUSD
            ) {
                return i;
            }
        }

        return tiers.length;
    }

    /// @return actual dates
    function getActualDates() public view returns (uint256 startDate, uint256 endDate) {
        uint256 tierIndex = getTierIndex();

        if (tierIndex < tiers.length) {
            startDate = tiers[tierIndex].startDate;
            endDate = tiers[tierIndex].endDate;
        } else {
            for (uint256 i = 0; i < tiers.length; i++) {
                if (
                    block.timestamp < tiers[i].startDate
                ) {
                    startDate = tiers[i].startDate;
                    endDate = tiers[i].endDate;
                    break;
                }
            }
        }

        if (startDate == 0) {
            startDate = tiers[tiers.length.sub(1)].startDate;
            endDate = tiers[tiers.length.sub(1)].endDate;
        }
    }

    function getTokensWithoutMinInvest(uint256 _weiAmount, uint256 _tokensAvailable) public view returns (
        uint256 tokens,
        uint256 tokensExcludingBonus,
        uint256 bonus
    ) {
        if (_weiAmount == 0) {
            return (0, 0, 0);
        }

        uint256 tierIndex = getTierIndex();
        if (tierIndex == tiers.length) {
            return (0, 0, 0);
        }

        uint256 usdAmount = _weiAmount.mul(etherPriceInUSD).div(1e18);

        tokensExcludingBonus = getTokensAmountByUSD(tierIndex, usdAmount);

        if (tiers[tierIndex].maxCollectedUSD < tiers[tierIndex].collectedUSD.add(usdAmount)) {
            return (0, 0, 0);
        }

        bonus = calculateBonusAmount(tierIndex, usdAmount);
        tokens = tokensExcludingBonus.add(bonus);

        if (tokens > _tokensAvailable) {
            return (0, 0, 0);
        }
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
        if (tierIndex == tiers.length || _weiAmount < tiers[tierIndex].minInvestInWei) {
            return (0, 0, 0);
        }

        return getTokensWithoutMinInvest(_weiAmount, _tokensAvailable);
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

        uint256 usdAmount = getUSDAmountByTokens(tierIndex, _tokens);

        if (tiers[tierIndex].maxCollectedUSD < tiers[tierIndex].collectedUSD.add(usdAmount)) {
            return (0, 0);
        }

        totalWeiAmount = usdAmount.mul(1e18).div(etherPriceInUSD);

        if (totalWeiAmount < uint256(1 ether).mul(tiers[tierIndex].minInvestInWei).div(etherPriceInUSD)) {
            return (0, 0);
        }

        tokensBonus = calculateBonusAmount(tierIndex, _tokens);
    }

    function calculateBonusAmount(uint256 _tierIndex, uint256 _usdAmount) public view returns (uint256 bonus) {
        uint256 length = tiers[_tierIndex].capsData.length.div(2);

        uint256 remainingUSDAmount = _usdAmount;
        uint256 newCollectedUSD = tiers[_tierIndex].collectedUSD;

        for (uint256 i = 0; i < length; i++) {
            if (newCollectedUSD.add(remainingUSDAmount) <= tiers[_tierIndex].capsData[i.mul(2)]) {
                bonus += getTokensAmountByUSD(_tierIndex, remainingUSDAmount)
                    .mul(tiers[_tierIndex].capsData[i.mul(2).add(1)])
                    .div(100);
                break;
            } else {
                uint256 diff = tiers[_tierIndex].capsData[i].sub(newCollectedUSD);
                remainingUSDAmount -= diff;
                newCollectedUSD += diff;
                bonus += getTokensAmountByUSD(_tierIndex, diff)
                    .mul(tiers[_tierIndex].capsData[i.mul(2).add(1)])
                    .div(100);
            }
        }
    }

    function getTokensAmountByUSD(uint256 _tierIndex, uint256 _usdAmount) public view returns (uint256) {
        if (_tierIndex < uint256(tiers.length)) {
            return _usdAmount.mul(1e18).div(tiers[_tierIndex].tokenInUSD);
        }
    }

    function getUSDAmountByTokens(uint256 _tierIndex, uint256 _tokensAmount) public view returns (uint256) {
        if (_tierIndex < uint256(tiers.length)) {
            return _tokensAmount.mul(tiers[_tierIndex].tokenInUSD).div(1e18);
        }
    }

    function getDiscount(uint256 _tierIndex) public view returns (uint256) {
        if (_tierIndex < uint256(tiers.length)) {
            return tiers[_tierIndex].discountPercents;
        }
    }

    function getMinEtherInvest(uint256 _tierIndex) public view returns (uint256) {
        if (_tierIndex < uint256(tiers.length)) {
            return tiers[_tierIndex].minInvestInWei;
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
