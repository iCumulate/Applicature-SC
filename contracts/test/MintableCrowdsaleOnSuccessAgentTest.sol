pragma solidity 0.4.25;


import '../agent/MintableCrowdsaleOnSuccessAgent.sol';


contract MintableCrowdsaleOnSuccessAgentTest is MintableCrowdsaleOnSuccessAgent {

    constructor(Crowdsale _crowdsale, MintableToken _token)MintableCrowdsaleOnSuccessAgent(_crowdsale, _token) public {

    }
    function onRefund(address _contributor, uint256 _tokens) public onlyCrowdsale() returns (uint256){
        _contributor = _contributor;
        _tokens = _tokens;
    }

    function onContribution(address, uint256, uint256, uint256)
    public onlyCrowdsale() {
    }

    function onStateChange(Crowdsale.State) public onlyCrowdsale() {
    }
}
