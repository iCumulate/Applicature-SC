pragma solidity 0.4.19;

import '../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol';
import "./ICUToken.sol";
import "./ICO.sol";
import "./Ownable.sol";


contract Referral is Ownable {

    using SafeMath for uint256;

    MintableTokenAllocator allocator;
    ICO public ico;

    uint256 public constant DECIMALS = 18;

    uint256 public totalSupply = 35000000 * 10 ** DECIMALS;

    mapping (address => bool) public claimed;

    function Referral(
        address _allocator,
        address _ico
    ) public {
        require(_allocator != address(0) && _ico != address(0));
        allocator = MintableTokenAllocator(_allocator);
        ico = ICO(_ico);
    }

    function setAllocator(address _allocator) public onlyOwner {
        if (_allocator != address(0)) {
            allocator = MintableTokenAllocator(_allocator);
        }
    }

    function setICO(address _ico) public onlyOwner {
        require(_ico != address(0));
        ico = ICO(_ico);
    }

    function multivestMint(
        address _address,
        uint256 _amount,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public {
        address recoveredAddress = ico.verify(_v, _r, _s);
        require(ico.isSoftCapMet() && ico.signers(recoveredAddress));

        _amount = _amount.mul(10 ** DECIMALS);
        require(
            claimed[_address] == false &&
            _address == msg.sender &&
            _amount > 0 &&
            _amount <= totalSupply
        );
        allocator.allocate(_address, _amount);
        totalSupply = totalSupply.sub(_amount);
        claimed[_address] = true;
    }
}
