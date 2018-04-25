pragma solidity 0.4.19;

import "./PeriodicTokenVesting.sol";
import "zeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol";
import {MintableTokenAllocator as Allocator} from './allocator/MintableTokenAllocator.sol';


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

    function ICUAllocation(
        address _bountyAddress
    ) public {
        require(_bountyAddress != address(0));
        bountyAddress = _bountyAddress;
    }

    function setICOEndTime(uint256 _icoEndTime) public onlyOwner {
        icoEndTime = _icoEndTime;
    }

    function allocateBounty(Allocator _allocator) public onlyOwner {
        if (bountyAddress != address(0)) {
            _allocator.allocate(bountyAddress, uint256(47000000000000000000000000));
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
    }

    function createVesting(
        address _beneficiary, uint256 _start, uint256 _cliff, uint256 _duration, uint256 _periods, bool _revocable
    ) public onlyOwner returns (PeriodicTokenVesting) {
        require(icoEndTime > 0 && icoEndTime.add(uint256(1 years).div(2)) > _start);
        PeriodicTokenVesting vesting = new PeriodicTokenVesting(
            _beneficiary, _start, _cliff, _duration, _periods, _revocable
        );

        vestings.push(vesting);

        VestingCreated(vesting, _beneficiary, _start, _cliff, _duration, _periods, _revocable);

        return vesting;
    }

    function revokeVesting(PeriodicTokenVesting _vesting, ERC20Basic token) public onlyOwner() {
        _vesting.revoke(token);

        VestingRevoked(_vesting);
    }
}
