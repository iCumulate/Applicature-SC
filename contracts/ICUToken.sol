pragma solidity 0.4.24;

import './token/erc20/openzeppelin/OpenZeppelinERC20.sol';
import './token/erc20/MintableBurnableToken.sol';
import './token/erc20/TimeLockedToken.sol';
import './LockupContract.sol';
import './ICUCrowdsale.sol';


contract ICUToken is OpenZeppelinERC20, MintableBurnableToken, TimeLockedToken, LockupContract {

    ICUCrowdsale public crowdsale;

    bool public isSoftCapAchieved;

    constructor(uint256 _unlockTokensTime) public
    OpenZeppelinERC20(0, "iCumulate", 18, "ICU", false)
    MintableBurnableToken(4700000000e18, 0, true)
    TimeLockedToken(_unlockTokensTime)
    LockupContract(730 days, 0, 0) {

    }

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

    function transfer(address _to, uint256 _tokens) public returns (bool) {
        require(true == isTransferAllowed(msg.sender, _tokens));
        return super.transfer(_to, _tokens);
    }

    function transferFrom(address _holder, address _to, uint256 _tokens) public returns (bool) {
        require(true == isTransferAllowed(_holder, _tokens));
        return super.transferFrom(_holder, _to, _tokens);
    }

    function isTransferAllowed(address _address, uint256 _value) public view returns (bool) {
        if (!isSoftCapAchieved && (address(crowdsale) == address(0) || false == crowdsale.isSoftCapAchieved(0))) {
            return false;
        }

        return isTransferAllowedInternal(_address, _value, block.timestamp, balanceOf(_address));
    }

    function burnUnsoldTokens(uint256 _tokensToBurn) public onlyBurnAgents() returns (uint256) {
        require(totalSupply_.add(_tokensToBurn) <= maxSupply);

        maxSupply = maxSupply.sub(_tokensToBurn);

        emit Burn(address(0), _tokensToBurn);
        emit Transfer(address(0), address(0), _tokensToBurn);

        return _tokensToBurn;
    }

}