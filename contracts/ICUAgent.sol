pragma solidity ^0.4.18;

import './agent/MintableCrowdsaleOnSuccessAgent.sol';
import './crowdsale/CrowdsaleImpl.sol';
import './ICUStrategy.sol';
import './ICUCrowdsale.sol';
import './ICUToken.sol';


contract ICUAgent is MintableCrowdsaleOnSuccessAgent {

    uint256 public constant FINAL_ROUND = 3;

    ICUStrategy public strategy;
    ICUCrowdsale public crowdsale;

    bool public burnStatus;

    constructor(
        ICUCrowdsale _crowdsale,
        ICUToken _token,
        ICUStrategy _strategy
    ) public MintableCrowdsaleOnSuccessAgent(_crowdsale, _token) {
        strategy = _strategy;
        crowdsale = _crowdsale;
    }

    /// @notice Takes actions on contribution
    function onContribution(
        address,
        uint256 _weiAmount,
        uint256 _tokens,
        uint256 _bonus
    ) public onlyCrowdsale() {
        strategy.updateTierState(_weiAmount, _tokens, _bonus);
    }

    function onStateChange(Crowdsale.State _state) public onlyCrowdsale() {
        if (
            icuToken.isSoftCapAchieved() == false
            && (_state == Crowdsale.State.Success || _state == Crowdsale.State.Finalized)
            && crowdsale.isSoftCapAchieved(0)
        ) {
            ICUToken(token).setIsSoftCapAchieved();
        }

        if (_state > Crowdsale.State.InCrowdsale && burnStatus == false) {
            uint256 unsoldTokensAmount = strategy.getTierUnsoldTokens(FINAL_ROUND);

            burnStatus = true;

            ICUToken(token).burnUnsoldTokens(unsoldTokensAmount);
        }

    }

    function onRefund(address _contributor, uint256 _tokens) public onlyCrowdsale() returns (uint256 burned) {
        burned = ICUToken(token).burnByAgent(_contributor, _tokens);
    }

    function updateLockPeriod(uint256 _time) public {
        require(msg.sender == address(strategy));
        ICUToken(token).setUnlockTime(_time);
    }

}

