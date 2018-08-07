pragma solidity ^0.4.23;


import '../agent/MintableCrowdsaleOnSuccessAgent.sol';


contract MintableCrowdsaleOnSuccessAgentTest is MintableCrowdsaleOnSuccessAgent {
    constructor(Crowdsale _crowdsale, MintableToken _token)MintableCrowdsaleOnSuccessAgent(_crowdsale, _token) public {

    }
    function onContribution(
        address _contributor,
        uint256 _weiAmount,
        uint256 _tokens,
        uint256 _bonus
    ) public onlyCrowdsale() {
        _contributor = _contributor;
        _weiAmount = _weiAmount;
        _tokens = _tokens;
        _bonus = _bonus;
    }

    function onRefund(address _contributor, uint256 _tokens) public onlyCrowdsale() returns (uint256 burned){
        _contributor = _contributor;
        _tokens = _tokens;
    }
}
