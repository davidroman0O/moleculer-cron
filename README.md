![Moleculer logo](http://moleculer.services/images/banner.png)

# moleculer-cron [![NPM version](https://img.shields.io/npm/v/moleculer-bee-queue.svg)](https://www.npmjs.com/package/moleculer-cron)

Cron mixin [Node-Cron](https://github.com/kelektiv/node-cron).


# Notes

Open source repositories are not your personal StackOverflow or your personal search engine. Please do not create issues that can be fixed with just few minutes on a search engine or stack overflow.

#   Description

Easy to use cron with moleculer!

# Install

```bash
$ npm install moleculer-cron --save
```

# Usage

## Create cron service

Specify all of your cron task inside of the constructor of the addon.


```js
const Cron = require("moleculer-cron");


broker.createService({
    name: "cron-job",

   mixins: [Cron],

    crons: [
        {
            name: "JobHelloWorld",
            cronTime: '* * * * *',
            manualStart: true,
            timeZone: 'America/Nipigon',
            onTick: async function() {
                this.logger.info('JobHelloWorld ticked');
                await this.call("cron-job.say")
                    .then(data => this.logger.info("Oh!", data))
                    .catch(e => this.logger.info("error ", e))
            },
            runOnInit: function() {
                this.logger.info("JobHelloWorld is created");
            },
            onComplete: function() {
                this.logger.info("JobHelloWorld is finished");
            }
        },

        {
            name: "JobWhoStartAnother",
            cronTime: '* * * * *',
            timeZone: 'America/Nipigon',
            onTick: function() {

                this.logger.info('JobWhoStartAnother ticked');

                var job = this.getJob("JobHelloWorld");

                if (!job.lastDate() || this.$jobHelloWorldLastDate != undefined) {
                    this.logger.info("JobHelloWorld need to start! Therefore I should die!");
                    job.start();
                    this.getJob("JobWhoStartAnother").stop();
                } else {
                    this.$jobHelloWorldLastDate = job.lastDate()
                    this.logger.info(`JobHelloWorld is already started! therefore stop! at ${this.$jobHelloWorldLastDate}`);
                    job.stop();
                }
            },
            runOnInit: function() {
                this.logger.info("JobWhoStartAnother is created");
            },
            onComplete: function() {
                this.logger.info("JobWhoStartAnother is finished");
            },
        }

    ],

    actions: {
        say: {
            handler(ctx) {
                return "HelloWorld!";
            }
        }
    }

});

```

#   How to use it (edited Node-Cron documentation)


Available Cron patterns:
==========

    Asterisk. E.g. *
    Ranges. E.g. 1-3,5
    Steps. E.g. */2

[Read up on cron patterns here](http://crontab.org). Note the examples in the
link have five fields, and 1 minute as the finest granularity, but this library
has six fields, with 1 second as the finest granularity.

Cron Ranges
==========

When specifying your cron values you'll need to make sure that your values fall within the ranges. For instance, some cron's use a 0-7 range for the day of week where both 0 and 7 represent Sunday. We do not.

 * Seconds: 0-59
 * Minutes: 0-59
 * Hours: 0-23
 * Day of Month: 1-31
 * Months: 0-11 (Jan-Dec)
 * Day of Week: 0-6 (Sun-Sat)

API
==========

Parameter Based

* `Cron`
    * `cronTime` - [REQUIRED] - The time to fire off your job. This can be in the form of cron syntax or a JS [Date](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date) object.
    * `onTick` - [REQUIRED] - The function to fire at the specified time.
    * `name` - [OPTIONAL] - Set a name to the job, will be automaticly generated if you don't set it
    * `onComplete` - [OPTIONAL] - A function that will fire when the job is complete, when it is stopped.
    * `manualStart` - [OPTIONAL] - Specifies whether to start the job just before exiting the constructor. By default this is set to false. If left at default you will need to call `job.start()` in order to start the job (assuming `job` is the variable you set the cronjob to). This does not immediately fire your `onTick` function, it just gives you more control over the behavior of your jobs.
    * `timeZone` - [OPTIONAL] - Specify the timezone for the execution. This will modify the actual time relative to your timezone. If the timezone is invalid, an error is thrown. You can check all timezones available at [Moment Timezone Website](http://momentjs.com/timezone/).
    * `runOnInit` - [OPTIONAL] - This will be fired on `start()` function as soon as the requisit initialization has happened.
  
* `CronJob`
  * `start` - Runs your job.
  * `stop` - Stops your job.
  * `setTime` - Change the time for the `CronJob`. Param must be a `CronTime` from `getCronTime`.
  * `lastDate` - Tells you the last execution date.
  * `nextDates` - Provides an array of the next set of dates that will trigger an `onTick`.
  * `addCallback` - Allows you to add `onTick` callbacks.

* `getCronTime(time)`
  * Return a CronTime instance
    * `time` - [REQUIRED] - The time to fire off your job. This can be in the form of cron syntax or a JS [Date](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date) object.
