pragma solidity ^0.4.23;

import './DistributedDirectContributionForwarder.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

/// @title CappedDistributedDirectContributionForwarder
/// @author Applicature
/// @notice Contract is responsible for distributing collected ethers, that are received from CrowdSale.
/// @dev implementation
contract CappedDistributedDirectContributionForwarder is DistributedDirectContributionForwarder {

    using SafeMath for uint256;

    uint256 public capCollected;

    uint256 public currentCap;

    Cap[] public caps;

    struct Cap {
        uint256 total;
        uint256 collected;
        uint256[] newProportions;
    }

    //_capsData
    //cap
    //reciever[0] proportion
    //reciever[1] proportion
    //...
    //cap
    //...
    constructor(
        uint256 _proportionAbsMax,
        address[] _receivers,
        uint256[] _initialProportions,
        uint256[] _capsData
    ) public DistributedDirectContributionForwarder(_proportionAbsMax, _receivers, _initialProportions) {
        uint256 divAmount = _receivers.length.add(1);
        uint256 length = _capsData.length.div(divAmount);
        uint256[] memory newProportions;
        for (uint256 i = 0; i < length; i++) {
            caps.push(Cap(_capsData[i.mul(divAmount)], 0, newProportions));
            for (uint256 j = 1; j < divAmount; j++) {
                caps[i].newProportions.push(_capsData[i.mul(divAmount).add(j)]);
            }
        }
    }

    function forward() public payable {
        require(false);
    }

    function processForward(uint256 _capAmount) public payable {
        require(msg.value > 0 && _capAmount> 0);

        weiCollected += msg.value;
        capCollected += _capAmount;

        processForward(msg.value, _capAmount);
    }

    function processForward(uint256 _totalValue, uint256 _capAmount) internal {
        if (
            caps[currentCap].total > 0 &&
            caps[currentCap].total < caps[currentCap].collected.add(_capAmount)
        ) {
            uint256 diffAmount = caps[currentCap].total.sub(caps[currentCap].collected);
            uint256 diffValue = _totalValue.mul(diffAmount).div(_capAmount);

            caps[currentCap].collected = caps[currentCap].total;

            internalForward(diffValue);

            for (uint256 i = 0; i < receivers.length; i++) {
                receivers[i].proportion = caps[currentCap].newProportions[i];
            }

            currentCap++;

            processForward(_totalValue.sub(diffValue), _capAmount.sub(diffAmount));
            return;
        }

        caps[currentCap].collected = caps[currentCap].collected.add(_capAmount);

        internalForward(_totalValue);
    }

    function internalForward(uint256 _totalValue) internal {
        uint256 transferred;

        for (uint256 i = 0; i < receivers.length; i++) {
            Receiver storage receiver = receivers[i];

            uint256 value = _totalValue.mul(receiver.proportion).div(proportionAbsMax);

            if (i == receivers.length - 1) {
                value = _totalValue.sub(transferred);
            }

            transferred = transferred.add(value);

            receiver.receiver.transfer(value);

            emit ContributionForwarded(receiver.receiver, value);
        }

        weiForwarded = weiForwarded.add(transferred);
    }

}
