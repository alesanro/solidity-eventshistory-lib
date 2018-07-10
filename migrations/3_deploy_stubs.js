const FakeEventsEmitter = artifacts.require("FakeEventsEmitter")

module.exports = function(deployer, network) {
	// Use deployer to state migration tasks.
	if (network === 'test' || network === 'development') {
		deployer.deploy(FakeEventsEmitter)
	}
}
