![Moleculer logo](http://moleculer.services/images/banner.png)

# moleculer-cron [![NPM version](https://img.shields.io/npm/v/moleculer-bee-queue.svg)](https://www.npmjs.com/package/moleculer-cron)

Cron mixin [Node-Cron](https://github.com/kelektiv/node-cron).

# Install

```bash
$ npm install moleculer-cron --save
```

# Usage

## Create cron service
```js
const Cron = require("moleculer-cron");

broker.createService({
    name: "cron-job",
    mixins: [
        Cron(
            [
                {
                    cronTime: '*/1 * * * *',
                    onTick: function() {
                        console.log('job ticked');
                        this.getLocalService("cron-job")
                            .actions.say()
                            .then((data) => {
                                console.log("Hello", data);
                            });
                    },
                    runOnInit: function() {
                        console.log("init hello world");
                    },
                    start: false,
                    timeZone: 'America/Nipigon'
                }
            ]
        )
    ],

    actions: {


        say: {
            handler(ctx) {
                return "world!";
            }
        }

    }

});
```


