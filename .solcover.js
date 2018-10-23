module.exports = {
    skipFiles: ['Migrations.sol',
        'test/CrowdsaleAgentTest.sol',
        'test/CrowdsaleImplTest.sol',
        'test/HardCappedCrowdsaleTest.sol',
        'test/ICUCrowdsaleTest.sol',
        'test/ICUStrategyTest.sol',
        'test/MintableCrowdsaleOnSuccessAgentTest.sol',
        'test/RefundableCrowdsaleTest.sol',
        'test/TimeLockedTest.sol',
        'test/USDDateTiersPricingStrategy.sol',
        'test/USDExchange.sol',
        'test/USDExchangeTest.sol',
    ],
    // need for dependencies
    copyNodeModules: true,
    copyPackages: ['zeppelin-solidity', 'minimetoken'],
    dir: '.',
    norpc: false
};
