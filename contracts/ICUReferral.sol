pragma solidity ^0.4.23;

import './ICUCrowdsale.sol';
import './Referral.sol';


contract ICUReferral is Referral {

    constructor(
        address _allocator,
        address _crowdsale,
        bool _sentOnce
    ) public Referral(35000000e18, _allocator, _crowdsale, _sentOnce) {}

    function multivestMint(
        address _address,
        uint256 _amount,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public {
        ICUCrowdsale icuCrowdsale = ICUCrowdsale(crowdsale);
        address recoveredAddress = icuCrowdsale.verify(msg.sender, _v, _r, _s);
        require(icuCrowdsale.isSoftCapAchieved(0) && true == icuCrowdsale.signers(recoveredAddress));
        if (true == sentOnce) {
            require(claimed[_address] == false);
            claimed[_address] = true;

        }
        _amount = _amount.mul(10 ** DECIMALS);
        require(
            _address == msg.sender &&
            _amount > 0 &&
            (true == unLimited || _amount <= totalSupply)
        );
        claimedBalances[_address] = claimedBalances[_address].add(_amount);
        if (false == unLimited) {
            totalSupply = totalSupply.sub(_amount);
        }
        allocator.allocate(_address, _amount);
    }
}
