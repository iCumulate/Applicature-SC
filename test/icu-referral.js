var ICUToken = artifacts.require("./ICUToken.sol"),
    ICUStrategy = artifacts.require("./ICUStrategy.sol"),
    ICUCrowdsale = artifacts.require("./test/ICUCrowdsaleTest.sol"),
    MintableTokenAllocator = artifacts.require("./allocator/MintableTokenAllocator.sol"),
    DistributedDirectContributionForwarder = artifacts.require("./contribution/DistributedDirectContributionForwarder.sol"),
    ICUAgent = artifacts.require("./ICUAgent.sol"),
    ICUReferral = artifacts.require("./ICUReferral.sol"),

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
    const strategy = await ICUStrategy.new([], new BigNumber('400').mul(usdPrecision));

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
    // await strategy.setAgent(agent.address);
    await crowdsale.addSigner(signAddress);
    // await crowdsale.addExternalContributor(signAddress);

    const referral = await ICUReferral.new(allocator.address, crowdsale.address);

    await token.updateMintingAgent(referral.address, true);
    await allocator.addCrowdsales(referral.address);

    return {
        token,
        strategy,
        contributionForwarder,
        allocator,
        crowdsale,
        agent,
        referral
    };
}

async function makeTransaction(instance, sign, address, amount) {
    'use strict';
    var h = abi.soliditySHA3(['address', 'uint256'], [new BN(address.substr(2), 16), amount]),
        sig = web3.eth.sign(sign, h.toString('hex')).slice(2),
        r = `0x${sig.slice(0, 64)}`,
        s = `0x${sig.slice(64, 128)}`,
        v = web3.toDecimal(sig.slice(128, 130)) + 27;

    var data = abi.simpleEncode('multivestMint(address,uint256,uint8,bytes32,bytes32)', address, amount, v, r, s);

    return instance.sendTransaction({from: address, data: data.toString('hex')});
}


contract('ICUReferral', function (accounts) {

    it("deploy conract & check getTokens | getWeis", async function () {
        const {
            token,
            strategy,
            contributionForwarder,
            allocator,
            crowdsale,
            agent,
            allocation,
            stats,
            referral
        } = await deploy();

        await makeTransaction(referral, signAddress, accounts[1], new BigNumber('1000').valueOf())
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await strategy.updateDates(0, icoSince - 4600, icoSince - 3600);
        await strategy.updateDates(1, icoSince - 2600, icoSince - 1600);

        await makeTransaction(referral, signAddress, accounts[1], new BigNumber('1000').valueOf())
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await crowdsale.updateUsdCollected(new BigNumber('5000000').mul(usdPrecision).valueOf());

        await makeTransaction(referral, signAddress, accounts[1], new BigNumber('1000').valueOf())
            .then(Utils.receiptShouldSucceed);

        Utils.balanceShouldEqualTo(token.address, accounts[1],new BigNumber('1000').mul(precision).valueOf())
    });

});