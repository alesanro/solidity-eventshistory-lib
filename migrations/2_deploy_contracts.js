var EventsHistory = artifacts.require("EventsHistory");
var MultiEventsHistory = artifacts.require("MultiEventsHistory");

module.exports = function(deployer) {
  deployer.deploy(EventsHistory);
  deployer.deploy(MultiEventsHistory);
};
