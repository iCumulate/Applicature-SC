var ICUToken = artifacts.require("./ICUToken.sol"),
    ICUStrategy = artifacts.require("./ICUStrategy.sol"),
    ICUCrowdsale = artifacts.require("./test/ICUCrowdsaleTest.sol"),
    MintableTokenAllocator = artifacts.require("./allocator/MintableTokenAllocator.sol"),
    DistributedDirectContributionForwarder = artifacts.require("./contribution/DistributedDirectContributionForwarder.sol"),
    ICUAgent = artifacts.require("./ICUAgent.sol"),
    ICUAllocation = artifacts.require("./ICUAllocation.sol"),
    PeriodicTokenVesting = artifacts.require("./PeriodicTokenVesting.sol"),

    Utils = require("./utils"),
    BigNumber = require('BigNumber.js'),

    precision = new BigNumber("1000000000000000000"),
    usdPrecision = new BigNumber("100000"),
    icoSince = parseInt(new Date().getTime() / 1000 - 3600),
    icoTill = parseInt(new Date().getTime() / 1000) + 3600,
    yearAgo = 1524574180,
    signAddress = web3.eth.accounts[0],
    bountyAddress = web3.eth.accounts[5],
    treasuryAddress = web3.eth.accounts[7],
    compensationAddress = web3.eth.accounts[6],
    etherHolder = web3.eth.accounts[9],
    applicatureHolder = web3.eth.accounts[8];

var abi = require('ethereumjs-abi'),
    BN = require('bn.js');

async function deploy() {
    const token = await ICUToken.new(icoTill);
    const strategy = await ICUStrategy.new([], new BigNumber('400').mul(usdPrecision));

    await strategy.updateDates(0, icoSince, icoTill);
    await strategy.updateDates(1, icoTill + 3600, icoTill + 3600 * 2);

    const contributionForwarder = await DistributedDirectContributionForwarder.new(100, [etherHolder, applicatureHolder], [99, 1]);
    const allocator = await MintableTokenAllocator.new(token.address);
    const crowdsale = await ICUCrowdsale.new(
        allocator.address,
        contributionForwarder.address,
        strategy.address,
        icoSince,
        icoTill
    );

    const agent = await ICUAgent.new(crowdsale.address, token.address, strategy.address);

    const allocation = await ICUAllocation.new(bountyAddress, treasuryAddress);

    return {
        token,
        strategy,
        contributionForwarder,
        allocator,
        crowdsale,
        agent,
        allocation
    };
}

contract('Allocation', function (accounts) {

    it("check that METHODS could be called only by owner | setICOEndTime | createVesting | allocateVesting | revokeVesting", async function () {
        const {
            token,
            strategy,
            contributionForwarder,
            allocator,
            crowdsale,
            agent,
            allocation
        } = await deploy();

        await token.updateStateChangeAgent(accounts[0], true);
        await token.setUnlockTime(icoSince);
        await token.setIsSoftCapAchieved();

        await allocation.setICOEndTime(yearAgo, {from: accounts[0]})
            .then(Utils.receiptShouldSucceed);
        await allocation.setICOEndTime(yearAgo, {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await allocation.setICOEndTime(yearAgo - 31556926, {from: accounts[0]})
            .then(Utils.receiptShouldSucceed);
        await allocation.createVesting(accounts[0], icoTill, 0, 31556926, 3, true, applicatureHolder, allocator.address, 1000, {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await token.updateMintingAgent(allocator.address, true);
        await allocator.addCrowdsales(allocation.address);

        await allocation.createVesting(accounts[0], icoTill, 0, 31556926, 3, true, applicatureHolder, allocator.address, 1000)
            .then(Utils.receiptShouldSucceed)

        let vesting = await PeriodicTokenVesting.at(await allocation.vestings.call(0))
        assert.equal(await vesting.periods.call(), 3, 'periods is not equal');
        assert.equal(await vesting.beneficiary.call(), accounts[0], '_beneficiary is not equal');
        assert.equal(await vesting.start.call(), icoTill, 'start is not equal');
        assert.equal(await vesting.duration.call(), 31556926, 'duration is not equal');
        assert.equal(await vesting.revocable.call(), true, 'revocable is not equal');

        await token.updateMintingAgent(allocator.address, true);
        await allocator.addCrowdsales(allocation.address);
        // await token.unpause();
        // await allocation.allocateVesting(vesting.address, allocator.address, 28, {from: accounts[1]})
        //     .then(Utils.receiptShouldFailed)
        //     .catch(Utils.catchReceiptShouldFailed);
        // await allocation.allocateVesting(vesting.address, allocator.address, 0, {from: accounts[0]})
        //     .then(Utils.receiptShouldFailed)
        //     .catch(Utils.catchReceiptShouldFailed);
        //
        // await allocation.allocateVesting(vesting.address, allocator.address, 1000, {from: accounts[0]})
        //     .then(Utils.receiptShouldSucceed)

        assert.equal(new BigNumber(await vesting.vestedAmount.call(token.address)), 0, 'vestedAmount is not equal')

        assert.equal(await vesting.revoked.call(token.address), false, 'revoked is not equal')
        await allocation.revokeVesting(vesting.address, token.address, {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        assert.equal(await vesting.revoked.call(token.address), false, 'revoked is not equal')

        await allocation.revokeVesting(vesting.address, token.address, {from: accounts[0]})
        assert.equal(await vesting.revoked.call(token.address), true, 'revoked is not equal')

        await allocation.createVesting(accounts[2], parseInt(new Date().getTime() / 1000) - 61, 0, 60, 2, true, applicatureHolder, allocator.address, 100)
            .then(Utils.receiptShouldSucceed)

        vesting = await PeriodicTokenVesting.at(await allocation.vestings.call(1));
        // await allocation.allocateVesting(vesting.address, allocator.address, 100, {from: accounts[0]})
        assert.equal(new BigNumber(await vesting.vestedAmount.call(token.address)).valueOf(), 50, 'vestedAmount is not equal')

        await vesting.release(token.address)

        await allocation.createVesting(accounts[3], parseInt(new Date().getTime() / 1000) - 31, 0, 30, 2, true, applicatureHolder, allocator.address, 200)
            .then(Utils.receiptShouldSucceed)
        vesting = await PeriodicTokenVesting.at(await allocation.vestings.call(2))
        // await allocation.allocateVesting(vesting.address, allocator.address, 100, {from: accounts[0]})
        // await allocation.allocateVesting(vesting.address, allocator.address, 100, {from: accounts[0]})
        assert.equal(new BigNumber(await vesting.vestedAmount.call(token.address)).valueOf(), 100, 'vestedAmount is not equal')
        await vesting.release(token.address);

        Utils.balanceShouldEqualTo(token, accounts[2], 50)
        Utils.balanceShouldEqualTo(token, accounts[3], 100)

        await allocation.createVesting(accounts[4], parseInt(new Date().getTime() / 1000) - 61, 0, 30, 3, true, applicatureHolder, allocator.address, 100)
            .then(Utils.receiptShouldSucceed)
        vesting = await PeriodicTokenVesting.at(await allocation.vestings.call(3))
        // await allocation.allocateVesting(vesting.address, allocator.address, 100, {from: accounts[0]})
        assert.equal(new BigNumber(await vesting.vestedAmount.call(token.address)).valueOf(), 66, 'vestedAmount is not equal')
        await vesting.release(token.address);

        await vesting.release(token.address)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        Utils.balanceShouldEqualTo(token, accounts[4], 66)

        await  allocation.createVesting(accounts[5], parseInt(new Date().getTime() / 1000) - 90000, 0, 30, 2, true, applicatureHolder, allocator.address, 100)
            .then(Utils.receiptShouldSucceed)
        vesting = await PeriodicTokenVesting.at(await allocation.vestings.call(4)) //Address of the contract, obtained from Etherscan
        // await allocation.allocateVesting(vesting.address, allocator.address, 100, {from: accounts[0]})
        assert.equal(new BigNumber(await vesting.vestedAmount.call(token.address)).valueOf(), 100, 'vestedAmount is not equal')
        await vesting.release(token.address);
        Utils.balanceShouldEqualTo(token, accounts[5], 100)

    });

    it("check allocateBounty", async function () {
        const {
            token,
            strategy,
            contributionForwarder,
            allocator,
            crowdsale,
            agent,
            allocation
        } = await deploy();

        await token.updateMintingAgent(allocator.address, true);
        await allocator.addCrowdsales(allocation.address);

        await allocation.setICOEndTime(icoTill);

        Utils.balanceShouldEqualTo(token, bountyAddress, 0);

        await allocation.allocateBounty(allocator.address, crowdsale.address, {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await allocation.allocateBounty(allocator.address, crowdsale.address)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await allocation.setICOEndTime(icoSince);

        await allocation.allocateBounty(allocator.address, crowdsale.address)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await crowdsale.updateUsdCollected(new BigNumber('5000000').mul(usdPrecision).valueOf());

        await allocation.allocateBounty(allocator.address, crowdsale.address)
            .then(Utils.receiptShouldSucceed)

        Utils.balanceShouldEqualTo(token, bountyAddress, new BigNumber('47000000').mul(precision).valueOf());

        await allocation.allocateBounty(allocator.address, crowdsale.address)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

    });

    it("check createVesting after 6 months", async function () {
        const {
            token,
            strategy,
            contributionForwarder,
            allocator,
            crowdsale,
            agent,
            allocation
        } = await deploy();

        await token.updateStateChangeAgent(accounts[0], true);
        await token.setUnlockTime(icoSince);
        await token.setIsSoftCapAchieved();

        await allocation.setICOEndTime(yearAgo, {from: accounts[0]})
            .then(Utils.receiptShouldSucceed);
        await token.updateMintingAgent(allocator.address, true);
        await allocator.addCrowdsales(allocation.address);

        await allocation.createVesting(accounts[2], parseInt(new Date().getTime() / 1000) - 61, 0, 60, 2, true, applicatureHolder, allocator.address, 100)
            .then(Utils.receiptShouldSucceed)

        let vesting = await PeriodicTokenVesting.at(await allocation.vestings.call(0));
        assert.equal(new BigNumber(await vesting.vestedAmount.call(token.address)).valueOf(), 50, 'vestedAmount is not equal')

    });

});