![Moleculer logo](http://moleculer.services/images/banner.png)

# moleculer-cron [![NPM version](https://img.shields.io/npm/v/moleculer-bee-queue.svg)](https://www.npmjs.com/package/moleculer-cron)

Cron mixin for Moleculer using [Node-Cron](https://github.com/kelektiv/node-cron).

# Notes

Open source repositories are not your personal StackOverflow or your personal search engine. Please do not create issues that can be fixed with just a few minutes on a search engine or Stack Overflow.

# Description

Easy to use cron with Moleculer!

# Install

```bash
$ npm install moleculer-cron --save
```

# Usage

## Create cron service

Specify all of your cron tasks inside the `settings.cronJobs` array of the service.

```js
const CronMixin = require("moleculer-cron");

broker.createService({
    name: "cron-job",

    mixins: [CronMixin],

    settings: {
        cronJobs: [
            {
                name: "jobHelloWorld",
                cronTime: '*/5 * * * * *', // Run every 5 seconds
                manualStart: true, // This job needs to be started manually
                onTick: async function() {
                    this.logger.info('JobHelloWorld ticked');
                    try {
                        const data = await this.broker.call("cron-job.say");
                        this.logger.info("Oh!", data);
                        
                        // Stop this job and start the other one
                        const thisJob = this.getJob("jobHelloWorld");
                        const otherJob = this.getJob("jobToggle");
                        thisJob.stop();
                        otherJob.start();
                        this.logger.info("Stopped JobHelloWorld and started JobToggle");
                    } catch (e) {
                        this.logger.info("error ", e);
                    }
                },
                runOnInit: function() {
                    this.logger.info("JobHelloWorld is created");
                    // This job is manual start, so it won't start automatically
                },
                onComplete: function() {
                    this.logger.info("JobHelloWorld is stopped");
                }
            },
            {
                name: "jobToggle",
                cronTime: '*/5 * * * * *', // Run every 5 seconds
                onTick: function() {
                    this.logger.info('JobToggle ticked');
                    
                    // Stop this job and start the other one
                    const thisJob = this.getJob("jobToggle");
                    const otherJob = this.getJob("jobHelloWorld");
                    thisJob.stop();
                    otherJob.start();
                    this.logger.info("Stopped JobToggle and started JobHelloWorld");
                },
                runOnInit: function() {
                    this.logger.info("JobToggle is created");
                    // This job will start automatically
                },
                onComplete: function() {
                    this.logger.info("JobToggle is stopped");
                }
            }
        ]
    },

    actions: {
        say: {
            handler() {
                return "HelloWorld!";
            }
        },
    }
});
```

# How to use it (edited Node-Cron documentation)

## Available Cron patterns:

- Asterisk. E.g. *
- Ranges. E.g. 1-3,5
- Steps. E.g. */2

[Read up on cron patterns here](http://crontab.org). Note the examples in the
link have five fields, and 1 minute as the finest granularity, but this library
has six fields, with 1 second as the finest granularity.

## Cron Ranges

When specifying your cron values you'll need to make sure that your values fall within the ranges. For instance, some cron's use a 0-7 range for the day of week where both 0 and 7 represent Sunday. We do not.

- Seconds: 0-59
- Minutes: 0-59
- Hours: 0-23
- Day of Month: 1-31
- Months: 0-11 (Jan-Dec)
- Day of Week: 0-6 (Sun-Sat)

## API

Parameter Based

- `CronJob` Configuration:
  - `name` - [REQUIRED] - Set a name for the job.
  - `cronTime` - [REQUIRED] - The time to fire off your job. This can be in the form of cron syntax or a JS [Date](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date) object.
  - `onTick` - [REQUIRED] - The function to fire at the specified time.
  - `onComplete` - [OPTIONAL] - A function that will fire when the job is complete, when it is stopped.
  - `manualStart` - [OPTIONAL] - Specifies whether to start the job just before exiting the constructor. By default this is set to false. If left at default you will need to call `job.start()` in order to start the job.
  - `timeZone` - [OPTIONAL] - Specify the timezone for the execution. This will modify the actual time relative to your timezone. If the timezone is invalid, an error is thrown. You can check all timezones available at [Moment Timezone Website](http://momentjs.com/timezone/).
  - `runOnInit` - [OPTIONAL] - This will be fired on `start()` function as soon as the requisite initialization has happened.

- `CronJob` Methods (available through `this.getJob(jobName)`):
  - `start` - Runs your job.
  - `stop` - Stops your job.
  - `lastDate` - Tells you the last execution date.

- `getCronTime(time)`
  - Return a CronTime instance
    - `time` - [REQUIRED] - The time to fire off your job. This can be in the form of cron syntax or a JS [Date](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date) object.