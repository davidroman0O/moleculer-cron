"use strict";

let processCB = jest.fn();
let addCB = jest.fn();
let addDelayedCB = jest.fn();

const Cron = require("../../src");
const lolex = require("lolex");

const { ServiceBroker } = require("moleculer");


describe("Test Cron constructor", () => {
	const broker = new ServiceBroker();
	const service = broker.createService(Cron);
	it("should be created", () => {
		expect(service).toBeDefined();
		expect(service.$crons).toBeDefined();
	});

});

describe("Test Cron created handler", () => {
	const broker = new ServiceBroker();

	const nameJob = "Job-Should-Created";
	const service = broker.createService(
		{
			name: "test-should-be-created",
			mixins: [Cron],
			crons: [
					{
	            name: nameJob,
	            cronTime: '* * * * *',
	            onTick: jest.fn(),
	            runOnInit: jest.fn(),
	            timeZone: 'America/Nipigon'
	        }
			]
		}
	);

	it("should be created $crons", () => {
		expect(service).toBeDefined();
		expect(service.$crons).toBeDefined();
		expect(service.$crons.length).toBe(1);
		expect(service.$crons[0].name).toBe(nameJob);
	});

});



describe("Test Cron created handler called twice", () => {

	const broker = new ServiceBroker();
	const service = broker.createService(
		{
			name: "test-should-be-created",
			mixins: [Cron],
			crons: [
					{
	            name: "ahah",
	            cronTime: '* * * * *',
	            onTick: addDelayedCB,
	            runOnInit: addDelayedCB,
	            timeZone: 'America/Nipigon'
	        }
			]
		}
	);

	it("should be call start", () => {

		var clock = lolex.install({ shouldAdvanceTime: true, advanceTimeDelta: 40 });

		setTimeout(() => {
			expect(addDelayedCB).toHaveBeenCalledTimes(2);
			 clock.uninstall();
		}, 50);

	});

});

