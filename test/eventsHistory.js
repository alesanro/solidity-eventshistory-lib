const EventsHistory = artifacts.require('EventsHistory')
const FakeEventsEmitter = artifacts.require('FakeEventsEmitter')

contract("EventsHistory", function() {
    const fakeArgs = [0,0,0,0,0,0,0,0];

    let eventsHistory
    let eventsEmitter
    let eventsEmitterAbi

    before("setup", function(done) {
        EventsHistory.deployed()
        .then((instance) => eventsHistory = instance)
        .then(() => FakeEventsEmitter.deployed())
        .then((instance) => eventsEmitter = instance)
        .then(() => {
            eventsEmitterAbi = web3.eth.contract(FakeEventsEmitter.abi).at('0x0');
        })
        .then(() => done())
        .catch((e) => done(e))
    })

    it("can add event emitters with unique signature", function() {
        var signature = eventsEmitterAbi.emitEvent1.getData.apply(this, fakeArgs).slice(0,10)
        return eventsHistory.addEmitter.call(signature, eventsEmitter.address).then((r) => {
            return eventsHistory.addEmitter(signature, eventsEmitter.address).then(() => {
                assert.equal(r, true)

                return eventsHistory.emitters(signature)
            }).then((emitter) => {
                assert.equal(emitter, eventsEmitter.address)
            })
        })
    })

    it("can't add event emitter with the same signature twice", function() {
        var signature = eventsEmitterAbi.emitEvent1.getData.apply(this, fakeArgs).slice(0,10)
        return eventsHistory.addEmitter.call(signature, eventsEmitter.address).then((r) => {
            assert.equal(r, false)
        })
    })

    it("can add a new version of a contract", function() {
        return eventsHistory.addVersion.call(eventsEmitter.address, '0.0.1', 'just the first version').then((r) => {
            return eventsHistory.addVersion(eventsEmitter.address, '0.0.1', 'just the first version').then(() => {
                assert.equal(r, true)
                return eventsHistory.versions(eventsEmitter.address).then(eventsHistory.versionInfo)
            }).then((infoArgs) => {
                assert.equal(infoArgs[2], eventsEmitter.address)
                assert.equal(infoArgs[3], '0.0.1')
                assert.equal(infoArgs[4], 'just the first version')
            })
        })
    })

    context("add a new version: validation", function() {
        it("can't add a new version for an existed contract", function() {
            return eventsHistory.addVersion.call(eventsEmitter.address, '0.0.2', 'second version').then((r) => {
                return eventsHistory.addVersion(eventsEmitter.address, '0.0.2', 'second version').then(() => {
                    assert.equal(r, false)
                    return eventsHistory.versions(eventsEmitter.address).then(eventsHistory.versionInfo)
                }).then((infoArgs) => {
                    assert.equal(infoArgs[2], eventsEmitter.address)
                    assert.equal(infoArgs[3], '0.0.1')
                    assert.equal(infoArgs[4], 'just the first version')
                })
            })
        })

        it("can't add a new version when an empty version passed", function() {
            return eventsHistory.addVersion.call(eventsHistory.address, '', 'second version').then((r) => {
                return eventsHistory.addVersion(eventsHistory.address, '', 'second version').then(() => {
                    assert.equal(r, false)
                })
            })
        })

        it("can't add a new version when an empty changelog passed", function() {
            return eventsHistory.addVersion.call(eventsHistory.address, '0.0.1', '').then((r) => {
                return eventsHistory.addVersion(eventsHistory.address, '0.0.1', '').then(() => {
                    assert.equal(r, false)
                })
            })
        })

        it("can add a new version for other contract when all conditions are met", function() {
            return eventsHistory.addVersion.call(eventsHistory.address, '0.0.1', 'first ').then((r) => {
                return eventsHistory.addVersion(eventsHistory.address, '0.0.1', 'first').then(() => {
                    assert.equal(r, true)
                })
            })
        })
    })

    context("event emitting", function() {
        it("can't emit an event with a signature that is not presented in the history", function() {
            var data = eventsEmitterAbi.emitEvent2.getData('event2 payload')
            return eventsEmitter.sendTransaction({data: data, to: eventsHistory.address}).then(assert.fail).catch(() => {})
        })

        it("can't emit an event with a signature that is presented in the history but with wrong sender", function() {
            var data = eventsEmitterAbi.emitEvent1.getData('event1 payload')
            return eventsHistory.sendTransaction({data: data}).then((tx) => {
                assert.equal(tx.logs.length, 0)
            })
        })

        it("can emit an event with a signature that is presented in the history", function() {
            var data = eventsEmitterAbi.emitEvent1.getData('event1 payload')
            return eventsEmitter.sendTransaction({data: data, to: eventsHistory.address}).then((tx) => {
                assert.equal(tx.logs.length, 1)
                assert.equal(tx.logs[0].event, 'Event1')
            })
        })
    })
})
