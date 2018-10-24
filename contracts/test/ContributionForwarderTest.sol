pragma solidity 0.4.24;


import '../contribution/ContributionForwarder.sol';

/// @title ContributionForwarder
/// @author Applicature
/// @notice Contract is responsible for distributing collected ethers, that are received from CrowdSale.
/// @dev Base class
contract ContributionForwarderTest is ContributionForwarder{

    function internalForward() internal {}
}

