var ICUToken = artifacts.require("./ICUToken.sol"),
    ICUStrategy = artifacts.require("./ICUStrategy.sol"),
    ICUCrowdsale = artifacts.require("./test/ICUCrowdsaleTest.sol"),
    MintableTokenAllocator = artifacts.require("./allocator/MintableTokenAllocator.sol"),
    DistributedDirectContributionForwarder = artifacts.require("./contribution/DistributedDirectContributionForwarder.sol"),
    ICUAgent = artifacts.require("./ICUAgent.sol"),

    Utils = require("./utils"),
    BigNumber = require('bignumber.js'),

    precision = new BigNumber("1000000000000000000"),
    usdPrecision = new BigNumber("100000"),
    icoSince = parseInt(new Date().getTime() / 1000 - 3600),
    icoTill = parseInt(new Date().getTime() / 1000) + 3600,
    signAddress = web3.eth.accounts[0],
    bountyAddress = web3.eth.accounts[5],
    applicatureHolder = web3.eth.accounts[8],
    etherHolder = web3.eth.accounts[9];

var abi = require('ethereumjs-abi'),
    BN = require('bn.js');

async function deploy() {
    const token = await ICUToken.new(icoTill);
    const strategy = await ICUStrategy.new([
        new BigNumber('0.01').mul(usdPrecision).valueOf(),//tokenInUSD
        new BigNumber('1000000000').mul(precision).valueOf(),//maxTokensCollected
        new BigNumber('0').mul(precision).valueOf(),//discountPercents
        new BigNumber('8000').mul(usdPrecision).valueOf(),//minInvestInUSD
        new BigNumber('28').mul(1).valueOf(),//startDate
        new BigNumber('82').mul(1).valueOf(),//endDate

        new BigNumber('0.01').mul(usdPrecision).valueOf(),//tokenInUSD
        new BigNumber('1350000000').mul(precision).valueOf(),//maxTokensCollected
        new BigNumber('0').mul(precision).valueOf(),//discountPercents
        new BigNumber('80').mul(usdPrecision).valueOf(),//minInvestInUSD
        new BigNumber('28').mul(1).valueOf(),//startDate
        new BigNumber('82').mul(1).valueOf()//endDate
    ], [
        new BigNumber('1000000000').mul(precision).valueOf(), new BigNumber('30').mul(1).valueOf(),
        0, 0,
        0, 0,
        new BigNumber('400000000').mul(precision).valueOf(), new BigNumber('15').mul(1).valueOf(),
        new BigNumber('1200000000').mul(precision).valueOf(), new BigNumber('6').mul(1).valueOf(),
        new BigNumber('1350000000').mul(precision).valueOf(), new BigNumber('3').mul(1).valueOf(),
    ], new BigNumber('400').mul(usdPrecision));

    await strategy.updateDates(0, icoSince, icoTill);
    await strategy.updateDates(1, icoTill + 3600, icoTill + 3600 * 2);

    const contributionForwarder = await DistributedDirectContributionForwarder.new(100, [etherHolder, applicatureHolder], [99,1]);
    const allocator = await MintableTokenAllocator.new(token.address);
    const crowdsale = await ICUCrowdsale.new(
        allocator.address,
        contributionForwarder.address,
        strategy.address,
        icoSince,
        icoTill
    );

    const agent = await ICUAgent.new(crowdsale.address, token.address, strategy.address);

    await allocator.addCrowdsales(crowdsale.address);

    await token.updateMintingAgent(allocator.address, true);
    await token.updateBurnAgent(agent.address, true);
    await token.updateStateChangeAgent(agent.address, true);

    await crowdsale.setCrowdsaleAgent(agent.address);
    await strategy.setCrowdsaleAgent(agent.address);

    return {
        token,
        strategy,
        contributionForwarder,
        allocator,
        crowdsale,
        agent
    };
}

contract('ICUToken', function (accounts) {

    it("deploy contract & check state | setUnlockTime | setIsSoftCapAchieved | setCrowdSale | burnUnsoldTokens", async function () {
        const {
            token,
            strategy,
            contributionForwarder,
            allocator,
            crowdsale,
            agent
        } = await deploy();

        await Utils.checkState({token}, {
            token: {
                crowdsale: 0x0,
                isSoftCapAchieved: false,
                decimals: 18,
                name: 'iCumulate',
                symbol: 'ICU',
                burnAgents: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: false},
                ],
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
                time: icoTill,
                excludedAddresses: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: false},
                ],
            }
        });

        //setUnlockTime checked in strategy

        await token.setCrowdSale(crowdsale.address, {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await token.setCrowdSale(0x0, {from: accounts[0]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await token.setCrowdSale(crowdsale.address, {from: accounts[0]})
            .then(Utils.receiptShouldSucceed);

        await crowdsale.updateWhitelist(accounts[1], true);

        await strategy.updateDates(0, icoSince, icoTill);
        await strategy.updateDates(1, icoTill + 1600, icoTill + 2600);

        await crowdsale.sendTransaction({value: new BigNumber('20').mul(precision).valueOf(), from: accounts[1]})
            .then(Utils.receiptShouldSucceed);

        await crowdsale.updateUsdCollected(new BigNumber('5000000').mul(usdPrecision).valueOf());

        await Utils.checkState({token}, {
            token: {
                balanceOf: [
                    {[accounts[0]]: 0},
                    {
                        [accounts[1]]: new BigNumber('800000').mul(precision).valueOf()
                    },
                ],
                crowdsale: crowdsale.address,
                isSoftCapAchieved: false,
                decimals: 18,
                name: 'iCumulate',
                symbol: 'ICU',
                burnAgents: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: false},
                ],
                maxSupply: new BigNumber('4700000000').mul(precision).valueOf(),
                totalSupply: new BigNumber('800000').mul(precision).valueOf(),
                allowedMinting: true,
                mintingAgents: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                ],
                stateChangeAgents: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: false},
                ],
                time: icoTill,
                excludedAddresses: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: false},
                ],
            }
        });

        await strategy.updateDates(0, icoSince - 8600, icoSince - 7600);
        await strategy.updateDates(1, icoSince - 6600, icoSince - 5600);

        await crowdsale.updateState();

        await Utils.checkState({token}, {
            token: {
                balanceOf: [
                    {[accounts[0]]: 0},
                    {
                        [accounts[1]]: new BigNumber('800000').mul(precision).valueOf()
                    },
                ],
                crowdsale: crowdsale.address,
                isSoftCapAchieved: true,
                decimals: 18,
                name: 'iCumulate',
                symbol: 'ICU',
                burnAgents: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: false},
                ],
                maxSupply: new BigNumber('4700000000').sub(
                    new BigNumber('2350000000').sub('800000').valueOf()
                ).mul(precision).valueOf(),
                totalSupply: new BigNumber('800000').mul(precision).valueOf(),
                allowedMinting: true,
                mintingAgents: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                ],
                stateChangeAgents: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: false},
                ],
                time: icoTill,
                excludedAddresses: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: false},
                ],
            }
        });

    });

    it("deploy contract & check transfers", async function () {
        const {
            token,
            strategy,
            contributionForwarder,
            allocator,
            crowdsale,
            agent
        } = await deploy();

        await Utils.checkState({token}, {
            token: {
                crowdsale: 0x0,
                isSoftCapAchieved: false,
                decimals: 18,
                name: 'iCumulate',
                symbol: 'ICU',
                burnAgents: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: false},
                ],
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
                time: icoTill,
                excludedAddresses: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: false},
                ],
            }
        });

        await token.setCrowdSale(crowdsale.address, {from: accounts[0]})
            .then(Utils.receiptShouldSucceed);

        await crowdsale.updateWhitelist(accounts[1], true);

        await strategy.updateDates(0, icoSince, icoTill);
        await strategy.updateDates(1, icoTill + 1600, icoTill + 2600);

        await crowdsale.sendTransaction({value: new BigNumber('20').mul(precision).valueOf(), from: accounts[1]})
            .then(Utils.receiptShouldSucceed);

        await token.transfer(accounts[2], new BigNumber('100').mul(precision).valueOf(), {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await crowdsale.updateUsdCollected(new BigNumber('5000000').mul(usdPrecision).valueOf());

        await token.transfer(accounts[2], new BigNumber('100').mul(precision).valueOf(), {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await token.updateStateChangeAgent(accounts[0], true);
        await token.setUnlockTime(icoSince);

        await token.transfer(accounts[2], new BigNumber('100').mul(precision).valueOf(), {from: accounts[1]})
            .then(Utils.receiptShouldSucceed);

    });

    it("deploy contract & check transferFrom", async function () {
        const {
            token,
            strategy,
            contributionForwarder,
            allocator,
            crowdsale,
            agent
        } = await deploy();

        await token.setCrowdSale(crowdsale.address, {from: accounts[0]})
            .then(Utils.receiptShouldSucceed);

        await crowdsale.updateWhitelist(accounts[1], true);

        await strategy.updateDates(0, icoSince, icoTill);
        await strategy.updateDates(1, icoTill + 1600, icoTill + 2600);

        await crowdsale.sendTransaction({value: new BigNumber('20').mul(precision).valueOf(), from: accounts[1]})
            .then(Utils.receiptShouldSucceed);

        await token.approve(accounts[0], new BigNumber('100').mul(precision).valueOf(), {from:accounts[1]})
        await assert.equal((await token.allowance.call(accounts[1], accounts[0])).valueOf(), 100*precision, 'allowance is not equal')

        await token.updateExcludedAddress(accounts[1], true).then(Utils.receiptShouldSucceed)
        await assert.equal(await token.excludedAddresses.call(accounts[1]), true, 'excludedAddresses value is not equal')

        await assert.equal(await token.isTransferAllowed.call(accounts[1], 0), true, 'value is not equal')

        await token.transferFrom(accounts[1], accounts[2], new BigNumber('10').mul(precision).valueOf(), {from:accounts[0]})
            .then(Utils.receiptShouldSucceed)

        await token.updateExcludedAddress(accounts[1], false).then(Utils.receiptShouldSucceed)
        await assert.equal(await token.excludedAddresses.call(accounts[1]), false, 'excludedAddresses value is not equal')

        await token.transferFrom(accounts[1], accounts[2], new BigNumber('100').mul(precision).valueOf(), {from:accounts[0]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await crowdsale.updateUsdCollected(new BigNumber('10000000').mul(usdPrecision).valueOf());

        await token.transferFrom(accounts[1], accounts[2], new BigNumber('100').mul(precision).valueOf(), {from:accounts[0]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await token.updateStateChangeAgent(accounts[0], true);
        await token.setUnlockTime(icoSince);

        await token.transferFrom(accounts[1], accounts[2], new BigNumber('10').mul(precision).valueOf(), {from:accounts[0]})
            .then(Utils.receiptShouldSucceed);
    });

});