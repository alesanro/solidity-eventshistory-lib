const MultiEventsHistory = artifacts.require('MultiEventsHistory')
const FakeEventsEmitter = artifacts.require('FakeEventsEmitter')

const Reverter = require('./helpers/reverter')

contract("MultiEventsHistory", function(accounts) {
	const reverter = new Reverter(web3)

	let eventsHistory
	let eventsEmitter

	const users = {
		contractOwner: accounts[0],
		user1: accounts[1],
		user2: accounts[2],
	}

	let snapshotId

	before("setup", async () => {
		await reverter.promisifySnapshot()

		snapshotId = reverter.snapshotId

		eventsHistory = await MultiEventsHistory.deployed()
		eventsEmitter = await FakeEventsEmitter.deployed()

		await reverter.promisifySnapshot()
	})

	after(async () => {
		await reverter.promisifyRevert(snapshotId)
	})

	describe("authorization", () => {

		it("should not have authorization before adding to auth list", function() {
			return eventsHistory.isAuthorized(eventsEmitter.address).then(r => {
				assert.isNotOk(r)
			})
		})

		it("should be able to add emitter to authorization list", function() {
			return eventsHistory.authorize.call(eventsEmitter.address).then(r => {
				return eventsHistory.authorize(eventsEmitter.address).then(() => {
					assert.isOk(r)
					return eventsHistory.isAuthorized(eventsEmitter.address)
				}).then(r => {
					assert.isOk(r)
				})
			})
		})

		it("should not allow to authorize emitter twice", function() {
			return eventsHistory.authorize.call(eventsEmitter.address).then(r => {
				return eventsHistory.authorize(eventsEmitter.address).then(() => {
					assert.isNotOk(r)
					return eventsHistory.isAuthorized(eventsEmitter.address)
				}).then(r => {
					assert.isOk(r)
				})
			})
		})
	})

	describe("rejection", () => {

		it("user is not authorized", async () => {
			assert.isFalse(await eventsHistory.isAuthorized(users.user1))
		})

		it("should NOT allow to non contract owner", async () => {
			await eventsHistory.reject(eventsEmitter.address, { from: users.user1, })
			assert.isTrue(await eventsHistory.isAuthorized(eventsEmitter.address))
		})

		it("should allow contract owner to authorized a user", async () => {
			await eventsHistory.authorize(users.user1, { from: users.contractOwner, })
			assert.isTrue(await eventsHistory.isAuthorized(users.user1))
		})

		it("authorized user could reject any authorized address", async () => {
			await eventsHistory.reject(eventsEmitter.address, { from: users.user1, })
			assert.isFalse(await eventsHistory.isAuthorized(eventsEmitter.address))
		})
	})

	context("events history adapter", () => {
		const ERROR_CODE = 1278

		let snapshotId
		before(async () => {
			await reverter.promisifySnapshot()
			snapshotId = reverter.snapshotId

			await eventsEmitter.setEventsHistory(eventsHistory.address)

			await reverter.promisifySnapshot()
		})

		after(async () => {
			await reverter.promisifyRevert(snapshotId)
		})

		it("should have correct events history set up", async () => {
			assert.equal(
				await eventsEmitter.getEventsHistory(),
				eventsHistory.address
			)
		})

		describe("with authorized emitter", () => {

			before(async () => {
				await eventsHistory.authorize(eventsEmitter.address)
			})

			after(async () => {
				await reverter.promisifyRevert()
			})

			it("should have authorization for eventsEmitter", async () => {
				assert.isTrue(await eventsHistory.isAuthorized(eventsEmitter.address))
			})

			it("should be able to emit errorCode through events history", async () => {
				const tx = await eventsEmitter.invokeWithErrorCode()
				{
					assert.lengthOf(tx.logs, 1)
					const event = tx.logs[0]
					assert.equal(event.event, "ErrorCode")
					assert.equal(event.address, eventsHistory.address)
					assert.equal(event.args.self, eventsEmitter.address)
					assert.equal(event.args.errorCode, ERROR_CODE)
				}
			})

			it("should THROW when do not have delegatecall method", async () => {
				await eventsEmitter.invokeInvalidEvent().then(assert.fail, () => true)
			})
		})

		describe("with no authorized emitter", () => {

			it("should NOT have authorization for eventsEmitter", async () => {
				assert.isFalse(await eventsHistory.isAuthorized(eventsEmitter.address))
			})

			it("should NOT be able to emit errorCode through events history", async () => {
				const tx = await eventsEmitter.invokeWithErrorCode()
				assert.lengthOf(tx.logs, 0)
			})
		})
	})
})
