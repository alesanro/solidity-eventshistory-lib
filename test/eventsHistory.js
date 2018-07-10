const EventsHistory = artifacts.require('EventsHistory')
const FakeEventsEmitter = artifacts.require('FakeEventsEmitter')
const IncorrectEmitterInterface = artifacts.require('IncorrectEmitterInterface')

const Reverter = require('./helpers/reverter')

contract("EventsHistory", function() {
	const reverter = new Reverter(web3)

	let eventsHistory
	let eventsEmitter
	let eventsEmitterAbi
	let incorrectEmitterInterfaceAbi
	const zero = {
		address: "0x0000000000000000000000000000000000000000",
	}

	before("setup", async () => {
		eventsHistory = await EventsHistory.deployed()
		eventsEmitter = await FakeEventsEmitter.deployed()
		eventsEmitterAbi = web3.eth.contract(FakeEventsEmitter.abi).at('0x0')
		incorrectEmitterInterfaceAbi = web3.eth.contract(IncorrectEmitterInterface.abi).at("0x0")

		await reverter.promisifySnapshot()
	})

	describe("signature managing", () => {

		after(async () => {
			await reverter.promisifyRevert()
		})

		it("can add event emitters with unique signature", function() {
			var signature = eventsEmitterAbi.emitEvent1.getData(0).slice(0,10)
			return eventsHistory.addEmitter.call(signature, eventsEmitter.address).then(r => {
				return eventsHistory.addEmitter(signature, eventsEmitter.address).then(() => {
					assert.equal(r, true)

					return eventsHistory.emitters(signature)
				}).then(emitter => {
					assert.equal(emitter, eventsEmitter.address)
				})
			})
		})

		it("can't add event emitter with the same signature twice", function() {
			var signature = eventsEmitterAbi.emitEvent1.getData(0).slice(0,10)
			return eventsHistory.addEmitter.call(signature, eventsEmitter.address).then(r => {
				assert.equal(r, false)
			})
		})

		it("can add a new version of a contract", function() {
			return eventsHistory.addVersion.call(eventsEmitter.address, '0.0.1', 'just the first version').then(r => {
				return eventsHistory.addVersion(eventsEmitter.address, '0.0.1', 'just the first version').then(() => {
					assert.equal(r, true)
					return eventsHistory.versions(eventsEmitter.address).then(eventsHistory.versionInfo)
				}).then(infoArgs => {
					assert.equal(infoArgs[2], eventsEmitter.address)
					assert.equal(infoArgs[3], '0.0.1')
					assert.equal(infoArgs[4], 'just the first version')
				})
			})
		})
	})


	context("add a new version: validation", function() {

		before(async () => {
			await eventsHistory.addVersion(eventsEmitter.address, '0.0.1', 'just the first version')
		})

		after(async () => {
			await reverter.promisifyRevert()
		})

		it("can't add a new version for an existed contract", function() {
			return eventsHistory.addVersion.call(eventsEmitter.address, '0.0.2', 'second version').then(r => {
				return eventsHistory.addVersion(eventsEmitter.address, '0.0.2', 'second version').then(() => {
					assert.equal(r, false)
					return eventsHistory.versions(eventsEmitter.address).then(eventsHistory.versionInfo)
				}).then(infoArgs => {
					assert.equal(infoArgs[2], eventsEmitter.address)
					assert.equal(infoArgs[3], '0.0.1')
					assert.equal(infoArgs[4], 'just the first version')
				})
			})
		})

		it("can't add a new version when an empty version passed", function() {
			return eventsHistory.addVersion.call(eventsHistory.address, '', 'second version').then(r => {
				return eventsHistory.addVersion(eventsHistory.address, '', 'second version').then(() => {
					assert.equal(r, false)
				})
			})
		})

		it("can't add a new version when an empty changelog passed", function() {
			return eventsHistory.addVersion.call(eventsHistory.address, '0.0.1', '').then(r => {
				return eventsHistory.addVersion(eventsHistory.address, '0.0.1', '').then(() => {
					assert.equal(r, false)
				})
			})
		})

		it("can add a new version for other contract when all conditions are met", function() {
			return eventsHistory.addVersion.call(eventsHistory.address, '0.0.1', 'first ').then(r => {
				return eventsHistory.addVersion(eventsHistory.address, '0.0.1', 'first').then(() => {
					assert.equal(r, true)
				})
			})
		})
	})

	context("event emitting", () => {
		let snapshotId

		before(async () => {
			snapshotId = reverter.snapshotId

			await eventsEmitter.setEventsHistory(eventsHistory.address)

			await reverter.promisifySnapshot()
		})

		after(async () => {
			await reverter.promisifyRevert(snapshotId)
		})

		describe("with no signature added", () => {

			it("should NOT allow to delegate event emitting", async () => {
				const tx = await eventsEmitter.invokeWithErrorCode()
				assert.lengthOf(tx.logs, 0)
			})
		})

		describe("with added signature and version", () => {

			before(async () => {
				{
					const signature = eventsEmitterAbi.emitErrorCode.getData(0).slice(0, 10)
					await eventsHistory.addEmitter(signature, eventsEmitter.address)
				}
				{
					const signature = incorrectEmitterInterfaceAbi.emitAction.getData().slice(0, 10)
					await eventsHistory.addEmitter(signature, eventsEmitter.address)
				}
				await eventsHistory.addVersion(eventsEmitter.address, "1.1", "More events")
			})

			after(async () => {
				await reverter.promisifyRevert()
			})

			it("should allow to emit event 'ErrorCode'", async () => {
				const tx = await eventsEmitter.invokeWithErrorCode()
				assert.lengthOf(tx.logs, 1)
				assert.equal(tx.logs[0].event, "ErrorCode")
			})

			it("should THROW when sig were added but failed during invocation", async () => {
				await eventsEmitter.invokeInvalidEvent().then(assert.fail, () => true)
			})
		})

		describe("with added version but without signature", () => {

			before(async () => {
				await eventsHistory.addVersion(eventsEmitter.address, "1.1", "More events")
			})

			after(async () => {
				await reverter.promisifyRevert()
			})

			it("version is added", async () => {
				assert.notEqual((await eventsHistory.versions(eventsEmitter.address)).toNumber(), 0)
			})

			it("no signature was added", async () => {
				const signature = eventsEmitterAbi.emitErrorCode.getData(0).slice(0, 10)
				assert.equal(await eventsHistory.emitters(signature), zero.address)
			})

			it("should do NOTHING when no sig were added for a provided version", async () => {
				const tx = await eventsEmitter.invokeWithErrorCode()
				assert.lengthOf(tx.logs, 0)
			})
		})
	})
})
