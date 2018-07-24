pragma solidity ^0.4.24;

import "./PeriodicTokenVesting.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol";
import {MintableTokenAllocator as Allocator} from './allocator/MintableTokenAllocator.sol';
import {ICUToken as Token} from './ICUToken.sol';


contract ICUAllocation is Ownable {

    using SafeERC20 for ERC20Basic;
    using SafeMath for uint256;

    uint256 public icoEndTime;

    address[] public vestings;

    address public bountyAddress;

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

    constructor(address _bountyAddress) public {
        require(_bountyAddress != address(0));
        bountyAddress = _bountyAddress;
    }

    function setICOEndTime(uint256 _icoEndTime) public onlyOwner {
        icoEndTime = _icoEndTime;
    }

    function allocateBounty(Allocator _allocator) public onlyOwner {
        if (bountyAddress != address(0)) {
            _allocator.allocate(bountyAddress, 47000000e18);
            bountyAddress = address(0);
        }
    }

    function allocateVesting(
        PeriodicTokenVesting _vesting,
        Allocator _allocator,
        uint256 _amount
    ) public onlyOwner {
        require(_amount > 0);
        _allocator.allocate(address(_vesting), _amount);
        Token token = Token(address(_allocator.token()));
        token.log(_vesting.beneficiary(), _amount, icoEndTime);
    }

    function createVesting(
        address _beneficiary,
        uint256 _start,
        uint256 _cliff,
        uint256 _duration,
        uint256 _periods,
        bool _revocable,
        address _unreleasedHolder
    ) public onlyOwner returns (PeriodicTokenVesting) {
        require(icoEndTime > 0 && icoEndTime.add(uint256(1 years).div(2)) > _start);
        PeriodicTokenVesting vesting = new PeriodicTokenVesting(
            _beneficiary, _start, _cliff, _duration, _periods, _revocable, _unreleasedHolder
        );

        vestings.push(vesting);

        emit VestingCreated(vesting, _beneficiary, _start, _cliff, _duration, _periods, _revocable);

        return vesting;
    }

    function revokeVesting(PeriodicTokenVesting _vesting, ERC20Basic token) public onlyOwner() {
        _vesting.revoke(token);

        emit VestingRevoked(_vesting);
    }
}
