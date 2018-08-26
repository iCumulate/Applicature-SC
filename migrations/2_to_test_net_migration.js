const ICUToken = artifacts.require("./ICUToken.sol");
const ICUStrategy = artifacts.require("./ICUStrategy.sol");
const ICUCrowdsale = artifacts.require("./ICUCrowdsale.sol");
const MintableTokenAllocator = artifacts.require("./allocator/MintableTokenAllocator.sol");
const DistributedDirectContributionForwarder = artifacts.require("./contribution/DistributedDirectContributionForwarder.sol");
const ICUAgent = artifacts.require("./ICUAgent.sol");
const ICUAllocation = artifacts.require("./ICUAllocation.sol");
const ICUReferral = artifacts.require("./ICUReferral.sol");
const Stats = artifacts.require("./Stats.sol");
const SafeMath = artifacts.require("./../node_modules/openzeppelin-solidity/contracts/math/SafeMath");
const Ownable = artifacts.require("./Ownable.sol");

module.exports = function (deployer, network, accounts) {
    let precision = "1000000000000000000",
        usdPrecision = "100000",
        icoSince = parseInt(new Date().getTime() / 1000) - 3600,
        icoTill = parseInt(new Date().getTime() / 1000) + 3600,
        etherHolder = "0xb75037df93E6BBbbB80B0E5528acaA34511B1cD0".toLowerCase(),
        applicatureHolder = "0xb75037df93E6BBbbB80B0E5528acaA34511B1cD0".toLowerCase(),
        bounty = "0xb75037df93E6BBbbB80B0E5528acaA34511B1cD0".toLowerCase(),
        treasuryAddress = "0xb75037df93E6BBbbB80B0E5528acaA34511B1cD0".toLowerCase(),
        owner = "0x6DFF9C7c1a821190c9f3b34A835A01Dd58C90AF0".toLowerCase(),
        signAddress = "0x210b43061Cf74d533F0eAcF2578FBdbbd313F00d".toLowerCase(),
        token,
        strategy,
        contributionForwarder,
        allocator,
        crowdsale,
        agent,
        stats,
        allocation,
        referral;


    // if (network == 'rinkeby') {
    // }
    // if (network == 'development') {
    // }

    deployer.deploy(SafeMath, {overwrite: false});
    deployer.link(SafeMath, [
        ICUToken,
        ICUStrategy,
        ICUCrowdsale,
        MintableTokenAllocator,
        DistributedDirectContributionForwarder,
        ICUAgent,
        ICUAllocation,
        ICUReferral
    ]); // add other contracts here

    deployer.deploy(Ownable, {overwrite: false});
    deployer.link(Ownable, [
        ICUToken,
        ICUStrategy,
        ICUCrowdsale,
        MintableTokenAllocator,
        DistributedDirectContributionForwarder,
        ICUAgent,
        ICUAllocation,
        ICUReferral
    ]);

    deployer.then(function () {
        return deployer.deploy(ICUToken, icoTill);
    }).then(async () => {
        token = await ICUToken.deployed();
        return deployer.deploy(ICUStrategy, [
            0.01 * usdPrecision,//tokenInUSD
            1000000000 * precision,//maxTokensCollected
            0 * precision,//discountPercents
            8000 * usdPrecision,//minInvestInUSD
            1532908800,//startDate // 07/30/2018 @ 12:00am (UTC)
            1533427200,//endDate //08/05/2018 @ 12:00am (UTC)
            0.01 * usdPrecision,//tokenInUSD
            1350000000 * precision,//maxTokensCollected
            0 * precision,//discountPercents
            40 * usdPrecision,//minInvestInUSD
            1533427200,//startDate 08/05/2018 @ 12:00am (UTC)
            1537142400//endDate 09/17/2018 @ 12:00am (UTC)
        ], [
            1000000000 * precision, 40, 0, 0, 0, 0, 400000000 * precision, 20, 1200000000 * precision, 10, 1350000000 * precision, 5,
        ], 400 * usdPrecision);
    }).then(async () => {
        strategy = await ICUStrategy.deployed();
        return deployer.deploy(DistributedDirectContributionForwarder, 100, [etherHolder, applicatureHolder], [99, 1]);
    }).then(async () => {
        contributionForwarder = await DistributedDirectContributionForwarder.deployed();
        return deployer.deploy(MintableTokenAllocator, token.address);
    }).then(async () => {
        allocator = await MintableTokenAllocator.deployed();
        return deployer.deploy(ICUCrowdsale,
            allocator.address,
            contributionForwarder.address,
            strategy.address,
            1532908800,
            1537142400);
    }).then(async () => {
        crowdsale = await ICUCrowdsale.deployed();
        return deployer.deploy(ICUAgent, crowdsale.address, token.address, strategy.address);
    }).then(async () => {
        agent = await ICUAgent.deployed();
        return deployer.deploy(Stats, token.address, allocator.address, crowdsale.address, strategy.address);
    }).then(async () => {
        stats = await Stats.deployed();
        return deployer.deploy(ICUReferral, allocator.address, crowdsale.address);
    }).then(async () => {
        referral = await ICUReferral.deployed();
        return deployer.deploy(ICUAllocation, bounty, treasuryAddress);
    }).then(async () => {
        allocation = await ICUAllocation.deployed();
    }).then(async () => {
        console.log("allocator.addCrowdsales(crowdsale.address)");
        return allocator.addCrowdsales(crowdsale.address);
    }).then(async () => {
        console.log("token.updateMintingAgent(allocator.address, true);");
        return token.updateMintingAgent(allocator.address, true);
    }).then(async () => {
        console.log("token.updateBurnAgent(agent.address, true);");
        return token.updateBurnAgent(agent.address, true);
    }).then(async () => {
        console.log("token.updateStateChangeAgent(agent.address, true)");
        return token.updateStateChangeAgent(agent.address, true);
    }).then(async () => {
        console.log("crowdsale.setCrowdsaleAgent(agent.address);");
        return crowdsale.setCrowdsaleAgent(agent.address);
    }).then(async () => {
        console.log("strategy.setCrowdsaleAgent(agent.address)");
        return strategy.setCrowdsaleAgent(agent.address);
    }).then(async () => {
        console.log("allocation.setICOEndTime(icoTill + 5184002);");
        return allocation.setICOEndTime(1537142400);
    }).then(async () => {
        console.log("allocator.addCrowdsales(allocation.address);");
        return allocator.addCrowdsales(allocation.address);
    }).then(async () => {
        console.log("token.updateLockupAgent(allocation.address, true);");
        return token.updateLockupAgent(allocation.address, true);
    }).then(async () => {
        console.log("token.updateMintingAgent(referral.address, true);");
        return token.updateMintingAgent(referral.address, true);
    }).then(async () => {
        console.log("token.updateBurnAgent(agent.address, true);");
        return token.updateBurnAgent(agent.address, true);
    }).then(async () => {
        console.log("allocator.addCrowdsales(referral.address);");
        return allocator.addCrowdsales(referral.address);
    }).then(async () => {
        await crowdsale.addSigner(signAddress);
        await crowdsale.addExternalContributor(signAddress)
        await allocation.transferOwnership(owner)
        await token.transferOwnership(owner)
        await allocator.transferOwnership(owner)
        await strategy.transferOwnership(owner)
        await crowdsale.transferOwnership(owner)
        await referral.transferOwnership(owner)
    }).then(() => {
        console.log("Finished");
        console.log("Token", token.address);
        console.log("Strategy", strategy.address);
        console.log("contributionForwarder", contributionForwarder.address);
        console.log("Allocator", allocator.address);
        console.log("Crowdsale", crowdsale.address);
        console.log("Agent", agent.address);
        console.log("Stats", stats.address);
        console.log("Allocation", allocation.address);
        console.log("Referral", referral.address);
        console.log("Multivest", signAddress);
        console.log("owner", owner);


    }).catch((err) => {
        console.error('ERROR', err)
    });

};