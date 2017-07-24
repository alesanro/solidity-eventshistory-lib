var EventsHistory = artifacts.require("./EventsHistory.sol");
var MultiEventsHistory = artifacts.require("./MultiEventsHistory.sol");
var MultiEventsHistoryAdapter = artifacts.require("./MultiEventsHistoryAdapter.sol");

module.exports = function(deployer) {
  deployer.deploy(EventsHistory);
  deployer.deploy(MultiEventsHistory);
  deployer.deploy(MultiEventsHistoryAdapter);
};
