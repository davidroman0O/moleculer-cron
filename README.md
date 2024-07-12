# moleculer-cron [![NPM version](https://img.shields.io/npm/v/moleculer-cron.svg)](https://www.npmjs.com/package/moleculer-cron)

Cron mixin for Moleculer using [cron](https://www.npmjs.com/package/cron).

## Description

Easy to use cron with Moleculer!

## Install

```bash
$ npm install moleculer-cron --save
```

## Usage

### Create cron service

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
                        this.stopJob("jobHelloWorld");
                        this.startJob("jobToggle");
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
                    this.stopJob("jobToggle");
                    this.startJob("jobHelloWorld");
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

## Available Cron patterns:

- Asterisk. E.g. *
- Ranges. E.g. 1-3,5
- Steps. E.g. */2

[Read up on cron patterns here](http://crontab.org). Note that this library uses six fields, with 1 second as the finest granularity.

## Cron Ranges

- Seconds: 0-59
- Minutes: 0-59
- Hours: 0-23
- Day of Month: 1-31
- Months: 0-11 (Jan-Dec)
- Day of Week: 0-6 (Sun-Sat)

## API

### Job Configuration

- `name` - [REQUIRED] - Set a name for the job.
- `cronTime` - [REQUIRED] - The time to fire off your job. This can be in the form of cron syntax or a JS [Date](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date) object.
- `onTick` - [REQUIRED] - The function to fire at the specified time.
- `onComplete` - [OPTIONAL] - A function that will fire when the job is stopped.
- `manualStart` - [OPTIONAL] - Specifies whether to start the job just before exiting the constructor. Default is false.
- `timeZone` - [OPTIONAL] - Specify the timezone for the execution. Check all timezones available at [Moment Timezone Website](http://momentjs.com/timezone/).
- `runOnInit` - [OPTIONAL] - A function that will be fired when the job is created.

### Mixin Methods

- `startJob(jobName)` - Starts the specified job.
- `stopJob(jobName)` - Stops the specified job.
- `getJob(jobName)` - Returns the job object for the specified job name.

### Job Object Methods

- `startJob()` - Starts the job.
- `stopJob()` - Stops the job.
- `lastDate()` - Returns the last execution date of the job.
- `running()` - Returns whether the job is currently running.
- `setTime(time)` - Changes the time for the job. `time` can be a cron string or a Date object.
- `nextDates(count)` - Returns an array of the next `count` dates that the job will run.
- `addCallback(callback)` - Adds an additional callback function to be executed when the job ticks.

### Utility Methods

- `getCronTime(time)` - Returns a CronTime instance for the given time.

## Notes

For any issues or feature requests, please create an issue on the GitHub repository. Make sure to search existing issues before creating a new one.