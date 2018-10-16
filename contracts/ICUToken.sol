pragma solidity 0.4.24;

import './token/erc20/openzeppelin/OpenZeppelinERC20.sol';
import './token/erc20/MintableBurnableToken.sol';
import './token/erc20/TimeLockedToken.sol';
import './ICUCrowdsale.sol';


contract ICUToken is OpenZeppelinERC20, MintableBurnableToken, TimeLockedToken {

    ICUCrowdsale public crowdsale;

    bool public isSoftCapAchieved;

    constructor(uint256 _unlockTokensTime)
        public
        OpenZeppelinERC20(0, 'iCumulate', 18, 'ICU', false)
        MintableBurnableToken(4700000000e18, 0, true)
        TimeLockedToken(_unlockTokensTime)
    {}

    function setUnlockTime(uint256 _unlockTokensTime) public onlyStateChangeAgents {
        time = _unlockTokensTime;
    }

    function setIsSoftCapAchieved() public onlyStateChangeAgents {
        isSoftCapAchieved = true;
    }

    function setCrowdSale(address _crowdsale) public onlyOwner {
        require(_crowdsale != address(0));
        crowdsale = ICUCrowdsale(_crowdsale);
    }

    function updateExcludedAddress(address _address, bool _status) public onlyOwner {
        excludedAddresses[_address] = _status;
    }

    function transfer(address _to, uint256 _tokens) public returns (bool) {
        require(true == isTransferAllowed(msg.sender));
        return super.transfer(_to, _tokens);
    }

    function transferFrom(address _holder, address _to, uint256 _tokens) public returns (bool) {
        require(true == isTransferAllowed(_holder));
        return super.transferFrom(_holder, _to, _tokens);
    }

    function isTransferAllowed(address _address) public view returns (bool) {
        if (excludedAddresses[_address] == true) {
            return true;
        }

        if (!isSoftCapAchieved && (address(crowdsale) == address(0) || false == crowdsale.isSoftCapAchieved(0))) {
            return false;
        }

        return true;
    }

    function burnUnsoldTokens(uint256 _tokensToBurn) public onlyBurnAgents() returns (uint256) {
        require(maxSupply.sub(_tokensToBurn) >= totalSupply_);

        maxSupply = maxSupply.sub(_tokensToBurn);

        emit Burn(address(0), _tokensToBurn);

        return _tokensToBurn;
    }

}