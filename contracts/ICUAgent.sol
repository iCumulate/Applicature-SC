pragma solidity ^0.4.18;

import './agent/MintableCrowdsaleOnSuccessAgent.sol';
import './crowdsale/CrowdsaleImpl.sol';
import './ICUStrategy.sol';
import './ICUToken.sol';
import './ICUCrowdsale.sol';


contract ICUAgent is MintableCrowdsaleOnSuccessAgent {

    ICUToken public tokenContract;
    ICUStrategy public strategy;
    ICUCrowdsale public crowdsale;

    constructor(
        ICUCrowdsale _crowdsale,
        ICUToken _token,
        ICUStrategy _strategy
    ) public MintableCrowdsaleOnSuccessAgent(_crowdsale, _token) {
        tokenContract = _token;
        strategy = _strategy;
        crowdsale = _crowdsale;
    }

    /// @notice Takes actions on contribution
    function onContribution(
        address _contributor,
        uint256 _weiAmount,
        uint256 _tokens,
        uint256 _bonus
    ) public onlyCrowdsale() {
        ICUStrategy(_contributor).updateTierTokens(_weiAmount, _tokens, _bonus);
    }

    function onStateChange(Crowdsale.State _state) public onlyCrowdsale() {
        if (
            tokenContract.isSoftCapAchieved() == false
            && (_state == Crowdsale.State.Success || _state == Crowdsale.State.Finalized)
            && crowdsale.isSoftCapAchieved(0)
        ) {
            tokenContract.setIsSoftCapAchieved();
        }
    }

    function onRefund(address _contributor, uint256 _tokens) public onlyCrowdsale() returns (uint256 burned) {
        burned = tokenContract.burnByAgent(_contributor, _tokens);
    }

    function updateLockPeriod(uint256 _time) public {
        require(msg.sender == address(strategy));
        tokenContract.setUnlockTime(_time);
    }

}

