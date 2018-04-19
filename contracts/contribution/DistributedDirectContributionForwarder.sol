pragma solidity ^0.4.18;

import './ContributionForwarder.sol';

/// @title DistributedDirectContributionForwarder
/// @author Applicature
/// @notice Contract is responsible for distributing collected ethers, that are received from CrowdSale.
/// @dev implementation
contract DistributedDirectContributionForwarder is ContributionForwarder {
    Receiver[] public receivers;
    uint256 public proportionAbsMax;

    struct Receiver {
        address receiver;
        uint256 proportion; // abslolute value in range of 0 - proportionAbsMax
        uint256 forwardedWei;
    }

    // @TODO: should we use uint256 [] for receivers & proportions?
    function DistributedDirectContributionForwarder(
        uint256 _proportionAbsMax, address[] _receivers, uint256[] _proportions
    )
    public
    {
        proportionAbsMax = _proportionAbsMax;

        require(_receivers.length == _proportions.length);

        require(_receivers.length > 0);

        uint256 totalProportion;

        for (uint256 i = 0; i < _receivers.length; i++) {
            uint256 proportion = _proportions[i];

            totalProportion = totalProportion.add(proportion);

            receivers.push(Receiver(_receivers[i], proportion, 0));
        }

        require(totalProportion == proportionAbsMax);
    }

    /// @notice Check whether contract is initialised
    /// @return true if initialized
    function isInitialized() public constant returns (bool) {
        return true;
    }

    function internalForward() internal {
        uint256 transferred;

        for (uint256 i = 0; i < receivers.length; i++) {
            Receiver storage receiver = receivers[i];

            uint256 value = msg.value.mul(receiver.proportion).div(proportionAbsMax);

            if (i == receivers.length - 1) {
                value = msg.value.sub(transferred);
            }

            transferred = transferred.add(value);

            receiver.receiver.transfer(value);

            ContributionForwarded(receiver.receiver, value);
        }

        weiForwarded = weiForwarded.add(transferred);
    }
}
