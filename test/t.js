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


    return {token, ico, pricingStrategy, allocator, contributionForwarder, agent};
}

function makeTransactionKYC(instance, sign, address, value) {
    'use strict';
    var h = abi.soliditySHA3(['address', 'address'], [new BN(instance.address.substr(2), 16), new BN(address.substr(2), 16)]),
        sig = web3.eth.sign(sign, h.toString('hex')).slice(2),
        r = `0x${sig.slice(0, 64)}`,
        s = `0x${sig.slice(64, 128)}`,
        v = web3.toDecimal(sig.slice(128, 130)) + 27;

    var data = abi.simpleEncode('contribute(uint8,bytes32,bytes32)', v, r, s);

    return instance.sendTransaction({value: value, from: address, data: data.toString('hex')});
}

contract('Token', function (accounts) {

    it("deploy", async function () {
        const {token, ico, pricingStrategy, allocator, contributionForwarder, agent} = await deploy();

        let currentState = await ico.getState()//Initializing
        assert.equal(currentState, 1, "state doesn't match");

        let isBonusIncreased = await ico.isBonusIncreased.call()
        assert.equal(isBonusIncreased, false, "isBonusIncreased doesn't match");

        let ethHolderBalance = await Utils.getEtherBalance(etherHolder).valueOf();
        let acc1Balance = await Utils.getEtherBalance(accounts[1]).valueOf();
        let acc2Balance = await Utils.getEtherBalance(accounts[2]).valueOf();

        await token.updateMintingAgent(allocator.address, true);
        await ico.updateWhitelist(accounts[1], true);
        await ico.setCrowdsaleAgent(agent.address);
        await allocator.addCrowdsales(ico.address);

        currentState = await ico.getState()//BeforeCrowdsale
        assert.equal(currentState, 2, "state doesn't match");

        await pricingStrategy.updateDates(0, icoSince, icoTill);
        await ico.updateState();

        currentState = await ico.getState()//InCrowdsale
        assert.equal(currentState, 3, "state doesn't match");

        isBonusIncreased = await ico.isBonusIncreased.call()
        assert.equal(isBonusIncreased, false, "isBonusIncreased doesn't match");

        await ico.sendTransaction({value: new BigNumber('1').mul(precision).valueOf(), from: accounts[1]})
            .then(Utils.receiptShouldSucceed);

        await makeTransactionKYC(ico, bountyAddress, accounts[2], new BigNumber('2').mul(precision))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await ico.addSigner(signAddress);

        await makeTransactionKYC(ico, signAddress, accounts[2], new BigNumber('2').mul(precision))
            .then(Utils.receiptShouldSucceed);

        isBonusIncreased = await ico.isBonusIncreased.call()
        assert.equal(isBonusIncreased, false, "isBonusIncreased doesn't match");

        await pricingStrategy.updateDates(0, icoSince - 3600 * 2, icoSince - 3600);
        await ico.updateState();

        currentState = await ico.getState()//BeforeCrowdsale
        assert.equal(currentState, 2, "state doesn't match");

        await pricingStrategy.updateDates(1, icoSince, icoTill);
        await ico.updateState();

        currentState = await ico.getState()//InCrowdsale
        assert.equal(currentState, 3, "state doesn't match");

        let bonuses = await ico.bonusAmount.call()
        assert.equal(bonuses, new BigNumber('400500000').sub('12000').sub('24000').mul(precision).valueOf(), "bonuses doesn't match");

        await ico.sendTransaction({value: new BigNumber('0.19').mul(precision).valueOf(), from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await ico.sendTransaction({value: new BigNumber('0.2').mul(precision).valueOf(), from: accounts[1]})
            .then(Utils.receiptShouldSucceed);

        bonuses = await ico.bonusAmount.call()
        //preico hard cap - 10000000
        //sold - 40000 + 80000 = 120000
        //bonuses 12000 + 24000 + 1200
        assert.equal(bonuses, new BigNumber('400500000').sub('12000').sub('1200').sub('24000').add('10000000').sub('120000').mul(precision).valueOf(), "bonuses doesn't match");

        await pricingStrategy.updateDates(1, icoSince - 3600 * 2, icoSince - 3600);
        await pricingStrategy.updateDates(2, icoSince - 3600 * 2, icoSince - 3600);
        await pricingStrategy.updateDates(3, icoSince - 3600 * 2, icoSince - 3600);
        await ico.updateState();

        currentState = await ico.getState()//Refunding
        assert.equal(currentState, 6, "state doesn't match");

        await Utils.balanceShouldEqualTo(token, accounts[1], new BigNumber("48000").mul(precision).valueOf());
        await Utils.balanceShouldEqualTo(token, accounts[2], new BigNumber("80000").mul(precision).valueOf());

        await ico.claimBonuses({from:accounts[1]});
        await ico.claimBonuses({from:accounts[2]});

        await Utils.balanceShouldEqualTo(token, accounts[1], new BigNumber("48000").mul(precision).valueOf());
        await Utils.balanceShouldEqualTo(token, accounts[2], new BigNumber("80000").mul(precision).valueOf());


        let acc10Balance = await Utils.getEtherBalance(accounts[1]).valueOf();
        let acc20Balance = await Utils.getEtherBalance(accounts[2]).valueOf();

        await ico.refund({from:accounts[1]});
        await ico.refund({from:accounts[2]});

        console.log('acc1 balance before transactions -', new BigNumber(acc1Balance).valueOf());
        console.log('              after transactions -', new BigNumber(acc10Balance).valueOf());
        console.log('              after refunddddddd -', new BigNumber(await Utils.getEtherBalance(accounts[1])).valueOf());
        console.log('                     differencee -', new BigNumber(new BigNumber(await Utils.getEtherBalance(accounts[1]))).sub(acc10Balance).div(precision).valueOf());
        console.log('                     should be   -', new BigNumber('1').add('0.2').valueOf());

        console.log('acc2 balance before transactions -', new BigNumber(acc2Balance).valueOf());
        console.log('              after transactions -', new BigNumber(acc20Balance).valueOf());
        console.log('              after refunddddddd -', new BigNumber(await Utils.getEtherBalance(accounts[2])).valueOf());
        console.log('                     differencee -', new BigNumber(new BigNumber(await Utils.getEtherBalance(accounts[2]))).sub(acc20Balance).div(precision).valueOf());
        console.log('                     should be   -', new BigNumber('2').valueOf());

        await Utils.balanceShouldEqualTo(token, accounts[1], new BigNumber("0").mul(precision).valueOf());
        await Utils.balanceShouldEqualTo(token, accounts[2], new BigNumber("0").mul(precision).valueOf());

    });
});