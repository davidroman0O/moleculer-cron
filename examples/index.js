const { ServiceBroker } = require("moleculer");
const Cron = require("../src/index");

// Create a broker
const broker = new ServiceBroker();

// Create a service
broker.createService({
    name: "math",
    actions: {
        add(ctx) {
            return Number(ctx.params.a) + Number(ctx.params.b);
        }
    }
});

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


// Start broker
broker.start()
    // Call service
    .then(() => broker.call("math.add", { a: 5, b: 3 }))
    .then(res => broker.logger.info("5 + 3 =", res))
    .catch(err => console.error(`Error occurred! ${err.message}`));
