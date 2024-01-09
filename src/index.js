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

/**
*  Mixin service for Cron
*
* @name moleculer-cron
* @module Service
*/
module.exports = {
	name: "cron",

	/**
	 * Methods
	 */
	methods: {

		/**
		 * Find a job by name
		 * 
		 * @param {String} name 
		 * @returns {CronJob}
		 */
		getJob(name) {
			return this.$crons.find((job) => job.hasOwnProperty("name") && job.name == name);
		},

		//	stolen on StackOverflow
		makeid(size) {
			var text = "";
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

			for (var i = 0; i < size; i++)
			text += possible.charAt(Math.floor(Math.random() * possible.length));

			return text;
		},

		/**
		 * Get a Cron time
		 * @param {String} time 
		 */
		getCronTime(time) {
			return new cron.CronTime(time);
		}

	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {
		this.$crons = [];
		if (this.schema.crons) {
			// `cron` changed their way of creating crons, so now it's a function that will proxy the instanciation
			this.$crons = this.schema.crons.map((job) => {
				var instance_job = () => {
					// cronTime, onTick, onComplete, start, timeZone, context, runOnInit, utcOffset, unrefTimeout
					var cronjob = new cron.CronJob(
						job.cronTime, // cronTime
						job.onTick || (_ => {}), // onTick
						job.onComplete || (_ => {}), // onComplete
						job.manualStart || false, // start
						job.timeZone, // timeZone
						Object.assign(
							this.broker,
							{
								getJob: this.getJob,
							}
						), // context
						job.runOnInit || (_ => {}), // runOnInit
						job.utcOffset || null, // utcOffset
						job.unrefTimeout || null, // unrefTimeout
					)
					cronjob.manualStart = job.manualStart || false
					cronjob.name = job.name || this.makeid(20);
					return cronjob;
				};
				
				return instance_job;
			});
		}
		return this.Promise.resolve();
	},

	events: {
		"$broker.started": function() {
			this.$crons = this.$crons.map((job, idx) => {
				var jobCron = job();
				this.$crons[idx] = jobCron; // sneaky
				if (!jobCron.manualStart) {
					jobCron.start();
				}
				this.logger.info(`Start Cron - '${jobCron.name}'`);
				return jobCron;
			});
		}
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
