pragma solidity ^0.4.0;


import '../agent/MintableCrowdsaleBonusOnSoldTokensAgent.sol';
import '../crowdsale/Crowdsale.sol';
import './MintableTokenTest.sol';


contract MintableCrowdsaleBonusOnSoldTokensAgentTest is MintableCrowdsaleBonusOnSoldTokensAgent {


    bool public goalAchieved;
    address public bonusAddress;
    uint256 public bonusTokens;

    function MintableCrowdsaleBonusOnSoldTokensAgentTest(
        Crowdsale _crowdsale,
        MintableTokenTest _token,
        uint256 _tokensSoldGoal,
        address _bonusAddress, uint256 _bonusTokens) public MintableCrowdsaleBonusOnSoldTokensAgent(_crowdsale, _token, _tokensSoldGoal, _bonusAddress, _bonusTokens) {
        bonusAddress = _bonusAddress;
        bonusTokens = _bonusTokens;
    }

    event Test(uint256 a);

    function onContribution(address _contributor, uint256 _weiAmount, uint256 _tokens, uint256 _bonus) public {

        Test(_tokens);
        _contributor = _contributor;
        _weiAmount = _weiAmount;
        _tokens = _tokens;
        _bonus = _bonus;

        if (bonusMinted == false && crowdsale.tokensSold() > tokensSoldGoal) {
            bonusMinted = true;

            token.mint(bonusAddress, bonusTokens);
        }
    }

    function onStateChange(Crowdsale.State _state) public {
        if (_state == Crowdsale.State.Success && goalAchieved == false) {
            goalAchieved = true;

//            token.unpause();
            token.disableMinting();
        }
    }
}

