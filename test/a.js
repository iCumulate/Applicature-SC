var
    ICUToken = artifacts.require("./ICUToken.sol"),
    ICO = artifacts.require("./tests/TestICO.sol"),
    MintableTokenAllocator = artifacts.require("./allocator/MintableTokenAllocator.sol"),
    DistributedDirectContributionForwarder = artifacts.require("./contribution/DistributedDirectContributionForwarder.sol"),
    TokenDateBonusTiersPricingStrategy = artifacts.require("./pricing/TokenDateBonusTiersPricingStrategy.sol"),
    MintableCrowdsaleOnSuccessAgent = artifacts.require("./agent/MintableCrowdsaleOnSuccessAgent.sol"),
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
    compensationAddress = web3.eth.accounts[6],
    etherHolder = web3.eth.accounts[9],
    etherHolderApplicature = web3.eth.accounts[8];

var abi = require('ethereumjs-abi'),
    BN = require('bn.js');

async function deploy() {
    const token = await ICUToken.new();
    const allocator = await MintableTokenAllocator.new(token.address);
    const contributionForwarder = await DistributedDirectContributionForwarder.new(100, [etherHolder, etherHolderApplicature], [99, 1]);
    const pricingStrategy = await TokenDateBonusTiersPricingStrategy.new([
        //preICO
        new BigNumber('25000000000000').valueOf(),//price
        new BigNumber('10000000').mul(precision).valueOf(),//max
        30,//bonus
        new BigNumber('0.2').mul(precision).valueOf(),//minInvest
        icoTill + 3600,//start
        icoTill + 3600 * 2,

        //ICO
        new BigNumber('25000000000000').valueOf(),//price
        new BigNumber('4000000').mul(precision).valueOf(),//max
        15,//bonus
        new BigNumber('0.2').mul(precision).valueOf(),//minInvest
        icoTill + 3600,//start
        icoTill + 3600 * 2,

        new BigNumber('25000000000000').valueOf(),//price
        new BigNumber('8000000').mul(precision).valueOf(),//max
        6,//bonus
        new BigNumber('0.2').mul(precision).valueOf(),//minInvest
        icoTill + 3600,//start
        icoTill + 3600 * 2,

        new BigNumber('25000000000000').valueOf(),//price
        new BigNumber('1500000').mul(precision).valueOf(),//max
        3,//bonus
        new BigNumber('0.2').mul(precision).valueOf(),//minInvest
        icoTill + 3600,//start
        icoTill + 3600 * 2
    ], 18);

    const ico = await ICO.new(allocator.address, contributionForwarder.address, pricingStrategy.address);

    const agent = await MintableCrowdsaleOnSuccessAgent.new(ico.address, token.address, token.address);

    const allocation = await ICUAllocation.new(bountyAddress);

    return {token, ico, pricingStrategy, allocator, contributionForwarder, agent, allocation};
}
contract('Allocation', function (accounts) {

    it("check that METHODS could be called only by owner | setICOEndTime | createVesting | allocateVesting | revokeVesting", async function () {
        const {token, ico, pricingStrategy, allocator, contributionForwarder, agent, allocation} = await deploy();

        await allocation.setICOEndTime(yearAgo, {from: accounts[0]})
            .then(Utils.receiptShouldSucceed);
        await allocation.setICOEndTime(yearAgo, {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await allocation.createVesting(accounts[0], icoTill, 0, 31556926, 3, true, {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await allocation.createVesting(accounts[0], icoTill, 0, 31556926, 3, true)
            .then(Utils.receiptShouldSucceed)

        let vesting = await PeriodicTokenVesting.at(await allocation.vestings.call(0))
        assert.equal(await vesting.periods.call(), 3, 'periods is not equal');
        assert.equal(await vesting.beneficiary.call(), accounts[0], '_beneficiary is not equal');
        assert.equal(await vesting.start.call(), icoTill, 'start is not equal');
        assert.equal(await vesting.duration.call(), 31556926, 'duration is not equal');
        assert.equal(await vesting.revocable.call(), true, 'revocable is not equal');

        await token.updateMintingAgent(allocator.address, true);
        await allocator.addCrowdsales(allocation.address);
        await token.unpause();
        await allocation.allocateVesting(vesting.address, allocator.address, 28, {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await allocation.allocateVesting(vesting.address, allocator.address, 0, {from: accounts[0]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await allocation.allocateVesting(vesting.address, allocator.address, 1000, {from: accounts[0]})

        assert.equal(new BigNumber(await vesting.vestedAmount.call(token.address)), 0, 'vestedAmount is not equal')


        assert.equal(await vesting.revoked.call(token.address), false, 'revoked is not equal')
        await allocation.revokeVesting(vesting.address, token.address, {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        assert.equal(await vesting.revoked.call(token.address), false, 'revoked is not equal')
        await allocation.revokeVesting(vesting.address, token.address, {from: accounts[0]});
        assert.equal(await vesting.revoked.call(token.address), true, 'revoked is not equal')



        await  allocation.createVesting(accounts[2], parseInt(new Date().getTime() / 1000) - 1, 0, 60, 2, true)
            .then(Utils.receiptShouldSucceed)

        vesting = await PeriodicTokenVesting.at(await allocation.vestings.call(1));
        await allocation.allocateVesting(vesting.address, allocator.address, 100, {from: accounts[0]})
        assert.equal(new BigNumber(await vesting.vestedAmount.call(token.address)).valueOf(), 50, 'vestedAmount is not equal')
        await vesting.release(token.address);

        await allocation.createVesting(accounts[3], parseInt(new Date().getTime() / 1000) - 31, 0, 30, 2, true)
            .then(Utils.receiptShouldSucceed)
        await allocation.allocateVesting(vesting.address, allocator.address, 100, {from: accounts[0]})
        vesting = await PeriodicTokenVesting.at(await allocation.vestings.call(2))
        await allocation.allocateVesting(vesting.address, allocator.address, 100, {from: accounts[0]})
        assert.equal(new BigNumber(await vesting.vestedAmount.call(token.address)).valueOf(), 100, 'vestedAmount is not equal')
        await vesting.release(token.address);
        Utils.balanceShouldEqualTo(token, accounts[2], 50)
        Utils.balanceShouldEqualTo(token, accounts[3], 100)

        await allocation.createVesting(accounts[4], parseInt(new Date().getTime() / 1000) - 31, 0, 30, 3, true)
            .then(Utils.receiptShouldSucceed)
        vesting = await PeriodicTokenVesting.at(await allocation.vestings.call(3))
        await allocation.allocateVesting(vesting.address, allocator.address, 100, {from: accounts[0]})
        assert.equal(new BigNumber(await vesting.vestedAmount.call(token.address)).valueOf(), 66, 'vestedAmount is not equal')
        await vesting.release(token.address);

        await vesting.release(token.address)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        Utils.balanceShouldEqualTo(token, accounts[4], 66)

        await  allocation.createVesting(accounts[5], parseInt(new Date().getTime() / 1000) - 90000, 0, 30, 2, true)
            .then(Utils.receiptShouldSucceed)
        vesting = await PeriodicTokenVesting.at(await allocation.vestings.call(4)) //Address of the contract, obtained from Etherscan
        await allocation.allocateVesting(vesting.address, allocator.address, 100, {from: accounts[0]})
        assert.equal(new BigNumber(await vesting.vestedAmount.call(token.address)).valueOf(), 100, 'vestedAmount is not equal')
        await vesting.release(token.address);
        Utils.balanceShouldEqualTo(token, accounts[5], 100)

    });

    it("check allocateBounty", async function () {
        const {token, ico, pricingStrategy, allocator, contributionForwarder, agent, allocation} = await deploy();

        await token.updateMintingAgent(allocator.address, true);
        await allocator.addCrowdsales(allocation.address);

        Utils.balanceShouldEqualTo(token, bountyAddress, 0);

        await allocation.allocateBounty(allocator.address, {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await allocation.allocateBounty(allocator.address);

        Utils.balanceShouldEqualTo(token, bountyAddress, new BigNumber('47000000').mul(precision).valueOf());

        await allocation.allocateBounty(allocator.address);
        await allocation.allocateBounty(allocator.address);

        Utils.balanceShouldEqualTo(token, bountyAddress, new BigNumber('47000000').mul(precision).valueOf());

    });

});