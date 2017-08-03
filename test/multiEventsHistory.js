const MultiEventsHistory = artifacts.require('MultiEventsHistory')
const FakeEventsEmitter = artifacts.require('FakeEventsEmitter')

contract("MultiEventsHistory", function(accounts) {
    let eventsHistory
    let eventsEmitter
    let eventsEmitterAbi

    before("setup", function(done) {
        MultiEventsHistory.deployed()
        .then((instance) => eventsHistory = instance)
        .then(() => FakeEventsEmitter.deployed())
        .then((instance) => eventsEmitter = instance)
        .then(() => {
            eventsEmitterAbi = web3.eth.contract(FakeEventsEmitter.abi).at('0x0');
        })
        .then(() => done())
        .catch((e) => done(e))
    })

    it("should not have authorization before adding to auth list", function() {
        return eventsHistory.isAuthorized(eventsEmitter.address).then((r) => {
            assert.isNotOk(r)
        })
    })

    it("should be able to add emitter to authorization list", function() {
        return eventsHistory.authorize.call(eventsEmitter.address).then((r) => {
            return eventsHistory.authorize(eventsEmitter.address).then(() => {
                assert.isOk(r)
                return eventsHistory.isAuthorized(eventsEmitter.address)
            }).then((r) => {
                assert.isOk(r)
            })
        })
    })

    it("should not allow to authorize emitter twice", function() {
        return eventsHistory.authorize.call(eventsEmitter.address).then((r) => {
            return eventsHistory.authorize(eventsEmitter.address).then(() => {
                assert.isNotOk(r)
                return eventsHistory.isAuthorized(eventsEmitter.address)
            }).then((r) => {
                assert.isOk(r)
            })
        })
    })

    context("event emitting", function() {
        it("can't emit an event with for unauthorized sender", function() {
            var data = eventsEmitterAbi.emitEvent1.getData('event1 payload')
            return eventsHistory.sendTransaction({data: data}).then((tx) => {
                assert.equal(tx.logs.length, 0)
            })
        })

        it("should throw when there is no way to delegate call", function() {
            var data = eventsEmitterAbi.emitEvent1.getData('event1 payload')
            return eventsHistory.authorize(eventsHistory.address).then(() => {
                return eventsHistory.sendTransaction({data: data}).then(assert.fail).catch(() => {})
            })
        })

        // Cannot send a message.sender address into a fallback function through sendTransaction call
        // it("should emit event for an authorized sender", function() {
        //     var data = eventsEmitterAbi.emitEvent1.getData('event1 payload')
        //     return eventsHistory.sendTransaction({data: data, from: eventsEmitter.address}).then((tx) => {
        //         assert.equal(tx.logs.length, 1)
        //         assert.equal(tx.logs[0].event, 'Event1')
        //     })
        // })
    })
})
