pragma solidity 0.4.24;

import './ICUCrowdsale.sol';
import './Referral.sol';


contract ICUReferral is Referral {

    constructor(
        address _allocator,
        address _crowdsale
    ) public Referral(35000000e18, _allocator, _crowdsale, true) {}

    function multivestMint(
        address _address,
        uint256 _amount,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public {
        ICUCrowdsale icuCrowdsale = ICUCrowdsale(crowdsale);
        icuCrowdsale.updateState();
        require(icuCrowdsale.isSoftCapAchieved(0) && block.timestamp > icuCrowdsale.endDate());
        super.multivestMint(_address, _amount, _v, _r, _s);
    }
}
