/*
    Tests:
    - deploy contract & check if the params  are equal
    - check burn
        - only burners
        - balance should be 0
        - should return amount of burned tokens
*/

var
    ICUToken = artifacts.require("./ICUToken.sol"),
    ICO = artifacts.require("./tests/TestICO.sol"),
    MintableTokenAllocator = artifacts.require("./allocator/MintableTokenAllocator.sol"),
    DistributedDirectContributionForwarder = artifacts.require("./contribution/DistributedDirectContributionForwarder.sol"),
    TokenDateBonusTiersPricingStrategy = artifacts.require("./pricing/TokenDateBonusTiersPricingStrategy.sol"),
    MintableCrowdsaleOnSuccessAgent = artifacts.require("./agent/MintableCrowdsaleOnSuccessAgent.sol"),

    Utils = require("./utils"),
    BigNumber = require('BigNumber.js'),

    precision = new BigNumber("1000000000000000000"),
    usdPrecision = new BigNumber("100000"),
    icoSince = parseInt(new Date().getTime() / 1000 - 3600),
    icoTill = parseInt(new Date().getTime() / 1000) + 3600,
    signAddress = web3.eth.accounts[0],
    bountyAddress = web3.eth.accounts[5],
    compensationAddress = web3.eth.accounts[6],
    etherHolder = web3.eth.accounts[9],
    etherHolderApplicature = web3.eth.accounts[8];

var abi = require('ethereumjs-abi'),
    BN = require('bn.js');

async function deploy() {
    const token = await ICUToken.new();
    const allocator = await MintableTokenAllocator.new(token.address);

    return {token, allocator};
}

contract('Token', function (accounts) {

    it("deploy contract & check if the params are equal", async function () {
        const {token, allocator} = await deploy();

        await Utils.checkState({token}, {
            token: {
                paused: true,
                pauseAgents: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                ],
                decimals: 18,
                name: 'iCumulate',
                symbol: 'ICU',
                standard: 'ERC20 0.1',
                maxSupply: new BigNumber('4700000000').mul(precision).valueOf(),
                allowedMinting: true,
                mintingAgents: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                ],
                stateChangeAgents: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: false},
                ],
                totalSupply: new BigNumber('0').mul(precision).valueOf(),
                burnAgents: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: false},
                ],
            }
        });

    });

    it("check burn", async function () {
        const {token, allocator} = await deploy();

        await token.updateMintingAgent(allocator.address, true);
        await allocator.addCrowdsales(accounts[0]);
        await allocator.allocate(accounts[3], 100);

        await token.burn(accounts[3], {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await token.updateBurnAgent(accounts[1], true, {from: accounts[4]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await token.updateBurnAgent(accounts[1], true, {from: accounts[0]});

        await Utils.checkState({token}, {
            token: {
                paused: true,
                pauseAgents: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                ],
                decimals: 18,
                name: 'iCumulate',
                symbol: 'ICU',
                standard: 'ERC20 0.1',
                maxSupply: new BigNumber('4700000000').mul(precision).valueOf(),
                allowedMinting: true,
                mintingAgents: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[allocator.address]: true},
                ],
                stateChangeAgents: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: false},
                ],
                totalSupply: new BigNumber('100').valueOf(),
                burnAgents: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: true},
                ],
                balanceOf: [
                    {[accounts[0]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[3]]: new BigNumber('100').valueOf()},
                ],
            }
        });

        let burnedAmount = await token.burn.call(accounts[3], {from: accounts[1]})
        assert.equal(burnedAmount, 100, "burnedAmount doesn't match");

        await token.burn(accounts[3], {from: accounts[1]});

        await Utils.checkState({token}, {
            token: {
                paused: true,
                pauseAgents: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                ],
                decimals: 18,
                name: 'iCumulate',
                symbol: 'ICU',
                standard: 'ERC20 0.1',
                maxSupply: new BigNumber('4700000000').mul(precision).valueOf(),
                allowedMinting: true,
                mintingAgents: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[allocator.address]: true},
                ],
                stateChangeAgents: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: false},
                ],
                totalSupply: new BigNumber('100').valueOf(),
                burnAgents: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: true},
                ],
                balanceOf: [
                    {[accounts[0]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[3]]: new BigNumber('0').valueOf()},
                ],
            }
        });

    });
});