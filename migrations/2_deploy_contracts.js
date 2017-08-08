var EventsHistory = artifacts.require("EventsHistory");

module.exports = function(deployer) {
  deployer.deploy(EventsHistory);
};
