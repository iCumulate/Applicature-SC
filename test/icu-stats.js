var ICUToken = artifacts.require("./ICUToken.sol"),
    ICUStrategy = artifacts.require("./ICUStrategy.sol"),
    ICUCrowdsale = artifacts.require("./test/ICUCrowdsaleTest.sol"),
    MintableTokenAllocator = artifacts.require("./allocator/MintableTokenAllocator.sol"),
    DistributedDirectContributionForwarder = artifacts.require("./contribution/DistributedDirectContributionForwarder.sol"),
    ICUAgent = artifacts.require("./ICUAgent.sol"),
    Stats = artifacts.require("./Stats.sol"),

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

    const stats = await Stats.new(token.address, allocator.address, crowdsale.address, strategy.address);

    await allocator.addCrowdsales(crowdsale.address);

    await token.updateMintingAgent(allocator.address, true);
    await token.updateStateChangeAgent(agent.address, true);
    await token.updateBurnAgent(agent.address, true);

    await crowdsale.setCrowdsaleAgent(agent.address);
    await strategy.setCrowdsaleAgent(agent.address);

    return {
        token,
        strategy,
        contributionForwarder,
        allocator,
        crowdsale,
        agent,
        stats
    };
}

contract('StatsContract', function (accounts) {

    it("deploy contract & check getTokens | getWeis", async function () {
        const {
            token,
            strategy,
            contributionForwarder,
            allocator,
            crowdsale,
            agent,
            stats
        } = await deploy();

        await strategy.updateDates(0, icoSince - 2600, icoSince - 1600);
        await strategy.updateDates(1, icoSince, icoTill);

        let getTokensData = await stats.getTokens.call(0, new BigNumber('1').mul(precision));
        assert.equal(new BigNumber(getTokensData[0]).valueOf(), new BigNumber('48000').mul(precision).valueOf(), "tokens is not equal");
        assert.equal(new BigNumber(getTokensData[1]).valueOf(), new BigNumber('40000').mul(precision).valueOf(), "tokensExcludingBonus is not equal");
        assert.equal(new BigNumber(getTokensData[2]).valueOf(), new BigNumber('8000').mul(precision).valueOf(), "bonus is not equal");

        getTokensData = await stats.getWeis.call(0, new BigNumber('40000').mul(precision));
        assert.equal(new BigNumber(getTokensData[0]).valueOf(), new BigNumber('1').mul(precision).valueOf(), "totalWeiAmount is not equal");
        assert.equal(new BigNumber(getTokensData[1]).valueOf(), new BigNumber('8000').mul(precision).valueOf(), "tokensBonus is not equal");

    });

    it("deploy contract & check getStats", async function () {
        const {
            token,
            strategy,
            contributionForwarder,
            allocator,
            crowdsale,
            agent,
            stats
        } = await deploy();

        await strategy.updateDates(0, icoSince - 2600, icoSince - 1600);
        await strategy.updateDates(1, icoSince, icoTill);
        await crowdsale.updateState();

        let statsData = await stats.getStats.call(1, [
            new BigNumber('1').mul(precision),
            new BigNumber('2').mul(precision),
            new BigNumber('3').mul(precision),
            new BigNumber('4').mul(precision),
            new BigNumber('5').mul(precision),
            new BigNumber('6').mul(precision),
            new BigNumber('1').mul(precision)
        ]);

        console.log(statsData[2], 'currencyContr');
        assert.equal(statsData[2][18], new BigNumber('48000').mul(precision).valueOf(), "tokens is not equal");
        assert.equal(statsData[2][19], new BigNumber('40000').mul(precision).valueOf(), "tokensExcludingBonus is not equal");
        assert.equal(statsData[2][20], new BigNumber('8000').mul(precision).valueOf(), "bonus is not equal");

        console.log(statsData[0], 'stats');
        assert.equal(statsData[0][0], new BigNumber('4700000000').mul(precision).valueOf(), "maxTokenSupply is not equal");
        assert.equal(statsData[0][1], new BigNumber('0').mul(precision).valueOf(), "totalTokenSupply is not equal");
        assert.equal(statsData[0][2], new BigNumber('2350000000').mul(precision).valueOf(), "maxSaleSupply is not equal");
        assert.equal(statsData[0][3], new BigNumber('0').mul(precision).valueOf(), "totalSaleSupply is not equal");
        assert.equal(statsData[0][4], new BigNumber('3').mul(1).valueOf(), "currentStat is not equal");
        assert.equal(statsData[0][5], new BigNumber('1').mul(1).valueOf(), "actualTier is not equal");
        assert.equal(statsData[0][6], new BigNumber('1350000000').mul(precision).valueOf(), "minEthInvest is not equal");
        assert.equal(statsData[0][7], new BigNumber('0.1').mul(precision).valueOf(), "minEthInvest is not equal");

        console.log(statsData[1], 'tiersData');

        assert.equal(statsData[1][0], new BigNumber('100').mul(precision).valueOf(), " tokenInUSD; is not equal");
        assert.equal(statsData[1][1], new BigNumber('0').mul(precision).valueOf(), " tokenInWei; is not equal");
        assert.equal(statsData[1][2], new BigNumber('1000000000').mul(precision).valueOf(), " maxTokensCollected; is not equal");
        assert.equal(statsData[1][3], new BigNumber('0').mul(precision).valueOf(), " soldTierTokens; is not equal");
        assert.equal(statsData[1][4], new BigNumber('0').mul(precision).valueOf(), " discountPercents; is not equal");
        assert.equal(statsData[1][5], new BigNumber('0').mul(precision).valueOf(), " bonusPercents; is not equal");
        assert.equal(statsData[1][6], new BigNumber('8000').mul(usdPrecision).valueOf(), " minInvestInUSD; is not equal");
        assert.equal(statsData[1][7], new BigNumber('0').mul(precision).valueOf(), " minInvestInWei; is not equal");
        assert.equal(statsData[1][8], new BigNumber('0').mul(precision).valueOf(), " maxInvestInUSD; is not equal");
        assert.equal(statsData[1][9], new BigNumber('0').mul(precision).valueOf(), " maxInvestInWei; is not equal");
        assert.equal(statsData[1][10], icoSince - 2600, " startDate; is not equal");
        assert.equal(statsData[1][11], icoSince - 1600, " endDate; is not equal");
        assert.equal(statsData[1][12], new BigNumber('1').valueOf(), " type is not equal");

        assert.equal(statsData[1][13], new BigNumber('100').mul(precision).valueOf(), " tokenInUSD; is not equal");
        assert.equal(statsData[1][14], new BigNumber('0').mul(precision).valueOf(), " tokenInWei; is not equal");
        assert.equal(statsData[1][15], new BigNumber('1350000000').mul(precision).valueOf(), " maxTokensCollected; is not equal");
        assert.equal(statsData[1][16], new BigNumber('0').mul(precision).valueOf(), " soldTierTokens; is not equal");
        assert.equal(statsData[1][17], new BigNumber('0').mul(precision).valueOf(), " discountPercents; is not equal");
        assert.equal(statsData[1][18], new BigNumber('0').mul(precision).valueOf(), " bonusPercents; is not equal");
        assert.equal(statsData[1][19], new BigNumber('40').mul(usdPrecision).valueOf(), " minInvestInUSD; is not equal");
        assert.equal(statsData[1][20], new BigNumber('0').mul(precision).valueOf(), " minInvestInWei; is not equal");
        assert.equal(statsData[1][21], new BigNumber('0').mul(precision).valueOf(), " maxInvestInUSD; is not equal");
        assert.equal(statsData[1][22], new BigNumber('0').mul(precision).valueOf(), " maxInvestInWei; is not equal");
        assert.equal(statsData[1][23], icoSince, " startDate; is not equal");
        assert.equal(statsData[1][24], icoTill, " endDate; is not equal");
        assert.equal(statsData[1][25], new BigNumber('2').valueOf(), " type is not equal");

    });

});