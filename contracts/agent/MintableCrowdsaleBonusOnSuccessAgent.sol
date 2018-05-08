pragma solidity ^0.4.18;


import './CrowdsaleAgent.sol';
import '../crowdsale/Crowdsale.sol';
import '../token/MintableToken.sol';


/// @title MintableCrowdsaleBonusOnSuccessAgent
/// @author Applicature
/// @notice Contract which takes actions on state change and contribution
/// un-pause tokens and disable minting on Crowdsale success, mint a bonus
/// @dev implementation
contract MintableCrowdsaleBonusOnSuccessAgent is CrowdsaleAgent {


    Crowdsale public crowdsale;
    MintableToken public token;
    bool public _isInitialized;
    bool public goalAchieved;
    address public bonusAddress;
    uint256 public bonusTokens;

    function MintableCrowdsaleBonusOnSuccessAgent(
        Crowdsale _crowdsale, MintableToken _token,
        address _bonusAddress, uint256 _bonusTokens
    )
    public CrowdsaleAgent(_crowdsale)
    {
        crowdsale = _crowdsale;
        token = _token;

        bonusAddress = _bonusAddress;
        bonusTokens = _bonusTokens;

        if (address(0) != address(_token) &&
        address(0) != address(_crowdsale) && address(0) != address(_bonusAddress)) {
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
    /// un-pause tokens and disable minting on Crowdsale success, mint a bonus
    /// @param _state Crowdsale.State
    function onStateChange(Crowdsale.State _state) public onlyCrowdsale() {
        if (_state == Crowdsale.State.Success && goalAchieved == false) {
            goalAchieved = true;

            token.mint(bonusAddress, bonusTokens);
            token.disableMinting();
        }
    }

    /// @notice Takes actions on refund
    function onRefund(address _contributor, uint256 _tokens) public onlyCrowdsale() returns (uint256 burned) {
        _contributor = _contributor;
        _tokens = _tokens;
        burned = burned;
        // TODO: add impl
    }

}
