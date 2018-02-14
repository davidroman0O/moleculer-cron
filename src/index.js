/*
 * moleculer-cron
 */

 "use strict";

const cron = require("cron");


/**
	Use the documentation of node-cron https://github.com/kelektiv/node-cron
	[
		{
			cronTime,
			onTick,
			onComplete,
			start,
			timezone,
			context,
			runOnInit
		}
	]
*/
module.exports = function createService(cronOpts) {

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


		},

		/**
		 * Service created lifecycle event handler
		 */
		created() {

			this.$crons = [];

			cronOpts.map((job) => {
				//	Just add the broker to handle actions and methods from other services
				var instance_job = new cron.CronJob(
					Object.assign(
						job,
						{
							context: this.broker
						}
					)
				);
				this.$crons.push(instance_job);
			});

			return this.Promise.resolve();
		},

		/**
		 * Service started lifecycle event handler
		 */
		started() {
			this.$crons.map((job) => {
				job.start();
			});
		},

		/**
		 * Service stopped lifecycle event handler
		 */
		stopped() {

		}
	};

};
