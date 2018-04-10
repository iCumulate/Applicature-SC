pragma solidity ^0.4.0;


import '../token/erc20/IErc20.sol';


contract IErc20Test is IErc20 {


    mapping(address => uint256) public balances;
    uint256 public _totalSupply;
    mapping(address => mapping(address => uint256)) public allowed;

    event Transfer(address indexed _from, address indexed _to, uint256 _tokenId);
    event Approval(address indexed _owner, address indexed _approved, uint256 _tokenId);

    function IErc20Test(uint256 _total) public IErc20 {
        _totalSupply = _total;
        setBalance(msg.sender, 100);
    }

    function totalSupply() public constant returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address _holder) public view returns (uint256) {
        return balances[_holder];
    }

    function allowance(address _holder, address _delegate) public view returns (uint256) {
        return allowed[_holder][_delegate];
    }

    function approve(address _to, uint256 _tokens) public returns (bool) {
        allowed[msg.sender][_to] = _tokens;
        Approval(msg.sender, _to, _tokens);
        return true;
    }

    function transfer(address _to, uint256 _tokens) public returns (bool) {
        address currentOwner = msg.sender;
        return transferInternal(currentOwner, _to, _tokens);
    }

    function transferFrom(address _holder, address _to, uint256 _tokens) public returns (bool) {
        return transferInternal(_holder, _to, _tokens);
    }

    function transferInternal(address _from, address _to, uint256 _tokens) internal returns (bool) {
        balances[_from] -= _tokens;
        balances[_to] += _tokens;

        Transfer(_from, _to, _tokens);
    }

    // internal methods
    function setBalance(address _holder, uint256 _tokens) internal {
        balances[_holder] = _tokens;
    }

    function setTotalSupply(uint256 _tokens) internal {
        _totalSupply = _tokens;
    }
}

