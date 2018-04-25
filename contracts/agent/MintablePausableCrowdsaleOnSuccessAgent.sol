pragma solidity ^0.4.18;


import './CrowdsaleAgent.sol';
import '../crowdsale/Crowdsale.sol';
import '../token/MintableBurnableToken.sol';
import '../token/PausableToken.sol';


/// @title MintableCrowdsaleOnSuccessAgent
/// @author Applicature
/// @notice Contract which takes actions on state change and contribution
/// un-pause tokens and disable minting on Crowdsale success
/// @dev implementation
contract MintableCrowdsaleOnSuccessAgent is CrowdsaleAgent {


    Crowdsale public crowdsale;
    MintableBurnableToken public mintableToken;
    PausableToken public pausableToken;

    bool public _isInitialized;

    function MintableCrowdsaleOnSuccessAgent(
        Crowdsale _crowdsale,
        MintableBurnableToken _mintableToken,
        PausableToken _pausableToken
    ) public CrowdsaleAgent(_crowdsale)
    {
        crowdsale = _crowdsale;
        mintableToken = _mintableToken;
        pausableToken = _pausableToken;

        if (
            address(0) != address(mintableToken) &&
            address(0) != address(pausableToken) &&
            address(0) != address(_crowdsale)
        ) {
            _isInitialized = true;
        } else {
            _isInitialized = false;
        }
    }

    /// @notice Check whether contract is initialised
    /// @return true if initialized
    function isInitialized() public constant returns (bool) {
        return _isInitialized;
    }

    /// @notice Takes actions on contribution
    function onContribution(address _contributor, uint256 _weiAmount, uint256 _tokens, uint256 _bonus)
    public onlyCrowdsale() {
        _contributor = _contributor;
        _weiAmount = _weiAmount;
        _tokens = _tokens;
        _bonus = _bonus;
        // TODO: add impl

    }

    /// @notice Takes actions on state change,
    /// un-pause tokens and disable minting on Crowdsale success
    /// @param _state Crowdsale.State
    function onStateChange(Crowdsale.State _state) public onlyCrowdsale() {
        if (_state == Crowdsale.State.Success) {
            mintableToken.disableMinting();
            pausableToken.unpause();
        }
    }

    /// @notice Takes actions on refund
    function onRefund(address _contributor, uint256 _tokens) public onlyCrowdsale() returns (uint256 burned) {
        _tokens = _tokens;
        if (crowdsale.getState() == Crowdsale.State.Refunding) {
            burned = mintableToken.burn(_contributor);
        }
    }

}

