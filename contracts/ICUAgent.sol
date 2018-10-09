pragma solidity 0.4.24;

import './agent/MintableCrowdsaleOnSuccessAgent.sol';
import './crowdsale/CrowdsaleImpl.sol';
import './ICUStrategy.sol';
import './ICUCrowdsale.sol';
import './ICUToken.sol';


contract ICUAgent is MintableCrowdsaleOnSuccessAgent {

    ICUStrategy public strategy;
    ICUCrowdsale public crowdsale;

    bool public burnStatus;

    constructor(
        ICUCrowdsale _crowdsale,
        ICUToken _token,
        ICUStrategy _strategy
    ) public MintableCrowdsaleOnSuccessAgent(_crowdsale, _token) {
        require(address(_strategy) != address(0) && address(_crowdsale) != address(0));
        strategy = _strategy;
        crowdsale = _crowdsale;
    }

    /// @notice Takes actions on contribution
    function onContribution(
        address,
        uint256 _tierIndex,
        uint256 _tokens,
        uint256 _bonus
    ) public onlyCrowdsale() {
        strategy.updateTierState(_tierIndex, _tokens, _bonus);
    }

    function onStateChange(Crowdsale.State _state) public onlyCrowdsale() {
        ICUToken icuToken = ICUToken(token);
        if (
            icuToken.isSoftCapAchieved() == false
            && (_state == Crowdsale.State.Success || _state == Crowdsale.State.Finalized)
            && crowdsale.isSoftCapAchieved(0)
        ) {
            icuToken.setIsSoftCapAchieved();
        }

        if (_state > Crowdsale.State.InCrowdsale && burnStatus == false) {
            uint256 unsoldTokensAmount = strategy.getUnsoldTokens();

            burnStatus = true;

            icuToken.burnUnsoldTokens(unsoldTokensAmount);
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

