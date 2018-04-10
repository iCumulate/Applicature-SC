pragma solidity ^0.4.0;


import './../../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol';
import '../token/MintableToken.sol';


contract MintableTokenTest is MintableToken {


    using SafeMath for uint256;

    uint256 public _totalSupply;
    mapping(address => uint256) public balances;
    mapping(address => bool) public mintingAgents;
    mapping(address => bool) public stateChangeAgents;
    bool public paused;
    bool public allowedMinting;

    event Test(uint256 a);

    function MintableTokenTest(uint256 _maxSupply, uint256 _mintedSupply, bool _allowedMinting)
    public MintableToken(_maxSupply, _mintedSupply, _allowedMinting) {

        _totalSupply = _mintedSupply.div(2);
        setBalance(msg.sender, 100);
        mintingAgents[msg.sender] = true;
        stateChangeAgents[msg.sender] = true;
        allowedMinting = _allowedMinting;
    }

    function mint(address _holder, uint256 _tokens) public {
        require(allowedMinting == true && totalSupply_.add(_tokens) <= maxSupply);

        totalSupply_ = totalSupply_.add(_tokens);

        balances[_holder] = balanceOf(_holder).add(_tokens);

        if (totalSupply_ == maxSupply) {
            allowedMinting = false;
        }
    }

    function disableMinting() public {
        allowedMinting = false;
    }

    function pause() public {
        paused = true;
    }

    function unpause() public {
        paused = false;
    }

    function availableTokens() public constant returns (uint256 tokens) {
        return maxSupply.sub(totalSupply());
    }

    function totalSupply() public constant returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address _holder) public constant returns (uint256) {
        return balances[_holder];
    }

    function setBalance(address _holder, uint256 _tokens) internal {
        balances[_holder] = _tokens;
    }

    function setTotalSupply(uint256 _tokens) internal {
        _totalSupply = _tokens;
    }

    function increaseBalance(address _holder, uint256 on) internal {
        balances[_holder] = balances[_holder].add(on);
    }

    function decreaseBalance(address _holder, uint256 on) internal {
        balances[_holder] = balances[_holder].sub(on);
    }

    function increaseTotalSupply(uint256 on) internal {
        _totalSupply.add(on);
    }

    function decreaseTotalSupply(uint256 on) internal {
        _totalSupply.sub(on);
    }

}

