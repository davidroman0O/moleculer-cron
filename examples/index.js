const { ServiceBroker } = require("moleculer");
const CronMixin = require("../src/index");

// Create a broker
const broker = new ServiceBroker();

// Create a math service
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
                onJobInitialised: function() {
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
                onJobInitialised: function() {
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

// Start broker
broker.start()
    // Call service
    .then(() => broker.call("math.add", { a: 5, b: 3 }))
    .then(res => broker.logger.info("5 + 3 =", res))
    .catch(err => console.error(`Error occurred! ${err.message}`));