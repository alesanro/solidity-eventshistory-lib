var FakeEventsEmitter = artifacts.require("./stubs/FakeEventsEmitter.sol");
var MultiEventsHistoryStub = artifacts.require("./stubs/MultiEventsHistoryStub.sol");

module.exports = function(deployer, network) {
  // Use deployer to state migration tasks.
  if (network === 'test' || network === 'development') {
      deployer.deploy(FakeEventsEmitter)
      .then(() => deployer.deploy(MultiEventsHistoryStub))
  }
};
