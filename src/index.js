/*
 * moleculer-cron
 */

 "use strict";

const cron = require("cron");


/**
	cronOpts
	[
		{
			cronTime,
			onTick,
			onComplete,
			start,
			timezone,
			manualStart,
			runOnInit
		}
	]
*/
module.exports = function createService() {

	/**
	*  Mixin service for Cron
	*
	* @name moleculer-cron
	* @module Service
	*/
	return {
		name: "cron",

		/**
		 * Methods
		 */
		methods: {

			getJob(name) {
				var searchedJob = undefined;
				this.$crons.map((job) => {
					if (job.hasOwnProperty("name") && job.name == name) {
						searchedJob = job;
					}
				});
				return searchedJob;
			},

			//	stolen on StackOverflow
			makeid(size) {
				var text = "";
				var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

				for (var i = 0; i < size; i++)
				text += possible.charAt(Math.floor(Math.random() * possible.length));

				return text;
			},

			getCronTime(time) {
				return new cron.CronTime(time);
			}

		},

		/**
		 * Service created lifecycle event handler
		 */
		created() {

			this.$crons = [];

			console.log("---- ", this.schema);

			this.schema.crons.map((job) => {
				//	Prevent error on runOnInit that handle onTick at the end of the constructor
				//	We handle it ourself
				var cacheFunction = job.runOnInit;
				job.runOnInit = undefined;
				//	Just add the broker to handle actions and methods from other services
				var instance_job = new cron.CronJob(
					Object.assign(
						job,
						{
							context: Object.assign(
											this.broker,
											{
												getJob: this.getJob
											}
									)
						}
					)
				);
				instance_job.runOnStarted = cacheFunction;
				instance_job.manualStart = job.manualStart || false;
				instance_job.name = job.name || this.makeid(20);
				this.$crons.push(instance_job);
			});

			return this.Promise.resolve();
		},

		/**
		 * Service started lifecycle event handler
		 */
		started() {
			this.$crons.map((job) => {
				if (!job.manualStart) {
					job.start();
				}
				this.logger.info("Start Cron - ", job.name);
				if (job.runOnStarted) {
					job.runOnStarted();
				}
			});
		},

		/**
		 * Service stopped lifecycle event handler
		 */
		stopped() {
			this.$crons.map((job) => {
				job.stop();
			});
		}
	};

};
