pragma solidity ^0.4.24;

import './PeriodicTokenVesting.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol';
import {ICUCrowdsale as Crowdsale} from './ICUCrowdsale.sol';
import {MintableTokenAllocator as Allocator} from './allocator/MintableTokenAllocator.sol';
import {ICUToken as Token} from './ICUToken.sol';


contract ICUAllocation is Ownable {

    using SafeERC20 for ERC20Basic;
    using SafeMath for uint256;

    uint256 public constant BOUNTY_TOKENS = 47000000e18;
    uint256 public constant MAX_TREASURY_TOKENS = 2350000000e18;

    uint256 public icoEndTime;

    address[] public vestings;

    address public bountyAddress;

    address public treasuryAddress;

    bool public isBountySent;

    bool public isTeamSent;

    event VestingCreated(
        address _vesting,
        address _beneficiary,
        uint256 _start,
        uint256 _cliff,
        uint256 _duration,
        uint256 _periods,
        bool _revocable
    );

    event VestingRevoked(address _vesting);

    constructor(address _bountyAddress, address _treasuryAddress) public {
        require(_bountyAddress != address(0) && _treasuryAddress != address(0));
        bountyAddress = _bountyAddress;
        treasuryAddress = _treasuryAddress;
    }

    function setICOEndTime(uint256 _icoEndTime) public onlyOwner {
        icoEndTime = _icoEndTime;
    }

    function allocateBounty(Allocator _allocator, Crowdsale _crowdsale) public onlyOwner {
        require(!isBountySent && icoEndTime < block.timestamp && _crowdsale.isSoftCapAchieved(0));

        isBountySent = true;
        _allocator.allocate(bountyAddress, BOUNTY_TOKENS);
    }

    function allocateTreasury(Allocator _allocator) public onlyOwner {
        require(icoEndTime < block.timestamp, 'ICO is not ended');
        require(isBountySent, 'Bounty is not sent');
        require(isTeamSent, 'Team vesting is not created');
        require(MAX_TREASURY_TOKENS >= _allocator.tokensAvailable(), 'Unsold tokens are not burned');

        _allocator.allocate(treasuryAddress, _allocator.tokensAvailable());
    }

    function createVesting(
        address _beneficiary,
        uint256 _start,
        uint256 _cliff,
        uint256 _duration,
        uint256 _periods,
        bool _revocable,
        address _unreleasedHolder,
        Allocator _allocator,
        uint256 _amount
    ) public onlyOwner returns (PeriodicTokenVesting) {
        require(icoEndTime > 0 && _amount > 0);

        isTeamSent = true;

        PeriodicTokenVesting vesting = new PeriodicTokenVesting(
            _beneficiary, _start, _cliff, _duration, _periods, _revocable, _unreleasedHolder
        );

        vestings.push(vesting);

        emit VestingCreated(vesting, _beneficiary, _start, _cliff, _duration, _periods, _revocable);

        _allocator.allocate(address(vesting), _amount);

        return vesting;
    }

    function revokeVesting(PeriodicTokenVesting _vesting, ERC20Basic token) public onlyOwner() {
        _vesting.revoke(token);

        emit VestingRevoked(_vesting);
    }
}
