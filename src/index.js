const { CronJob, CronTime } = require("cron");

module.exports = {
  name: "cron",

  settings: {
    cronJobs: []
  },

  created() {
    this.jobs = new Map();
    this.validateAndCreateJobs();
  },

  started() {
    this.startJobs();
  },

  async stopped() {
    for (const job of this.jobs.values()) {
      job.stopJob();
    }
  },

  methods: {
    validateAndCreateJobs() {
      if (!Array.isArray(this.settings.cronJobs)) {
        this.logger.warn("No cron jobs defined or invalid configuration");
        return;
      }

      for (const jobConfig of this.settings.cronJobs) {
        try {
          this.createJob(jobConfig);
        } catch (error) {
          this.logger.error(`Error creating cron job: ${error.message}`, jobConfig);
          console.error(error);
        }
      }
    },

    createJob(jobConfig) {
      if (!jobConfig.name || !jobConfig.cronTime || !jobConfig.onTick) {
        throw new Error("Invalid job configuration. Required: name, cronTime, onTick");
      }
    
      try {
        const job = new CronJob(
          jobConfig.cronTime,
          this.wrapOnTick(jobConfig.name, jobConfig.onTick),
          this.wrapOnComplete(jobConfig.name, jobConfig.onComplete),
          false,
          jobConfig.timeZone,
          this
        );
    
        const jobWrapper = {
          name: jobConfig.name,
          cronJob: job,
          startJob: function() {
            if (jobConfig.OnStart) jobConfig.OnStart();
            this.cronJob.start();
          },
          stopJob: function() {
            if (jobConfig.OnStop) jobConfig.OnStop();
            this.cronJob.stop();
          },
          lastDate: function() {
            return this.cronJob.lastDate();
          },
          running: function() {
            return this.cronJob.running;
          },
          setTime: function(time) {
            return this.cronJob.setTime(new CronTime(time));
          },
          nextDates: function(count) {
            return this.cronJob.nextDates(count);
          },
          addCallback: function(callback) {
            return this.cronJob.addCallback(callback);
          },
          manualStart: jobConfig.manualStart || false
        };
    
        this.jobs.set(jobConfig.name, jobWrapper);
        this.logger.info(`Cron job created: ${jobConfig.name}`);
    
        if (typeof jobConfig.runOnInit === 'function') {
          jobConfig.runOnInit.call(this);
        }
      } catch (error) {
        throw new Error(`Failed to create job ${jobConfig.name}: ${error.message}`);
      }
    },

    wrapOnTick(jobName, onTick) {
      return async () => {
        try {
          this.logger.debug(`Running cron job: ${jobName}`);
          await onTick.call(this);
        } catch (error) {
          this.logger.error(`Error in cron job ${jobName}: ${error.message}`);
        }
      };
    },

    wrapOnComplete(jobName, onComplete) {
      return () => {
        try {
          this.logger.debug(`Completed cron job: ${jobName}`);
          if (typeof onComplete === 'function') {
            onComplete.call(this);
          }
        } catch (error) {
          this.logger.error(`Error in onComplete for job ${jobName}: ${error.message}`);
        }
      };
    },

    startJobs() {
      for (const [name, job] of this.jobs) {
        if (!job.manualStart) {
          this.startJob(name);
        }
      }
    },
    
    startJob(name) {
      const job = this.jobs.get(name);
      if (job && !job.running()) {
        job.startJob();
        this.logger.info(`Started cron job: ${name}`);
      } else if (!job) {
        this.logger.warn(`Attempted to start non-existent job: ${name}`);
      }
    },
    
    stopJob(name) {
      const job = this.jobs.get(name);
      if (job && job.running()) {
        job.stopJob();
        this.logger.info(`Stopped cron job: ${name}`);
      } else if (!job) {
        this.logger.warn(`Attempted to stop non-existent job: ${name}`);
      }
    },
    
    getJob(name) {
      return this.jobs.get(name);
    },

    getCronTime(time) {
      return new CronTime(time);
    },

    getCronTime(time) {
      return new CronTime(time);
    }
  }
};