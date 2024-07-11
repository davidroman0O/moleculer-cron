"use strict";

const CronMixin = require("../../src");
const { ServiceBroker } = require("moleculer");
const { CronJob, CronTime } = require("cron");

// Mock cron module
jest.mock("cron", () => ({
  CronJob: jest.fn(),
  CronTime: jest.fn()
}));

describe("Test Cron Mixin", () => {
	let broker, service, mockCronJob;
  
	beforeEach(() => {
	  broker = new ServiceBroker({ logger: false });
	  mockCronJob = {
		start: jest.fn(),
		stop: jest.fn(),
		running: false
	  };
	  CronJob.mockImplementation((config) => {
		mockCronJob.config = config;
		return mockCronJob;
	  });
	});
  
	afterEach(() => {
	  broker.stop();
	  jest.clearAllMocks();
	});


  describe("Test Cron constructor", () => {
    beforeEach(() => {
      service = broker.createService({
        name: "cron",
        mixins: [CronMixin]
      });
    });

    it("should be created", () => {
      expect(service).toBeDefined();
      expect(service.jobs).toBeDefined();
      expect(service.jobs instanceof Map).toBeTruthy();
    });
  });

  describe("Test Cron job creation", () => {
    const testJob = {
      name: "testJob",
      cronTime: "* * * * *",
      onTick: jest.fn(),
      timeZone: "America/New_York"
    };

    beforeEach(() => {
      service = broker.createService({
        name: "cron",
        mixins: [CronMixin],
        settings: {
          cronJobs: [testJob]
        }
      });
    });

    it("should create a job", () => {
      expect(service.jobs.size).toBe(1);
      expect(service.jobs.has("testJob")).toBeTruthy();
      expect(CronJob).toHaveBeenCalledWith(expect.objectContaining({
        cronTime: "* * * * *",
        start: false,
        timeZone: "America/New_York"
      }));
    });

    it("should wrap onTick function", () => {
      const job = service.jobs.get("testJob");
      job.config.onTick();
      expect(testJob.onTick).toHaveBeenCalled();
    });
  });

  describe("Test Cron job management", () => {
    beforeEach(() => {
      service = broker.createService({
        name: "cron",
        mixins: [CronMixin],
        settings: {
          cronJobs: [{
            name: "testJob",
            cronTime: "* * * * *",
            onTick: jest.fn()
          }]
        }
      });
    });

    it("should start a job", () => {
      service.startJob("testJob");
      expect(mockCronJob.start).toHaveBeenCalled();
    });

    it("should stop a job", () => {
      mockCronJob.running = true;
      service.stopJob("testJob");
      expect(mockCronJob.stop).toHaveBeenCalled();
    });

    it("should handle non-existent job start gracefully", () => {
      const logSpy = jest.spyOn(service.logger, 'warn');
      service.startJob("nonExistentJob");
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Attempted to start non-existent job"));
    });

    it("should handle non-existent job stop gracefully", () => {
      const logSpy = jest.spyOn(service.logger, 'warn');
      service.stopJob("nonExistentJob");
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Attempted to stop non-existent job"));
    });
  });

  
  describe("Test service lifecycle", () => {
	let mockJobs;
  
	beforeEach(() => {
	  mockJobs = [];
	  CronJob.mockImplementation((config) => {
		const job = {
		  start: jest.fn(),
		  stop: jest.fn(),
		  running: false,
		  config
		};
		mockJobs.push(job);
		return job;
	  });
  
	  service = broker.createService({
		name: "cron",
		mixins: [CronMixin],
		settings: {
		  cronJobs: [
			{ name: "job1", cronTime: "* * * * *", onTick: jest.fn() },
			{ name: "job2", cronTime: "*/5 * * * *", onTick: jest.fn(), manualStart: true }
		  ]
		}
	  });
	});
  
	it("should start non-manual jobs on service start", async () => {
	  await broker.start();
	  
	  // Check that two jobs were created
	  expect(mockJobs.length).toBe(2);
	  
	  // Check that only the non-manual job was started
	  expect(mockJobs[0].start).toHaveBeenCalled();
	  expect(mockJobs[1].start).not.toHaveBeenCalled();
	});
  
	it("should stop all jobs on service stop", async () => {
	  await broker.start();
	  await broker.stop();
	  
	  // Check that both jobs were stopped
	  expect(mockJobs[0].stop).toHaveBeenCalled();
	  expect(mockJobs[1].stop).toHaveBeenCalled();
	});
  });
  

  describe("Test error handling", () => {
	it("should handle invalid job configurations", () => {
	  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	  const loggerSpy = jest.spyOn(broker.logger, 'error').mockImplementation(() => {});
	  const warnSpy = jest.spyOn(broker.logger, 'warn').mockImplementation(() => {});
  
	  service = broker.createService({
		name: "cron",
		mixins: [CronMixin],
		settings: {
		  cronJobs: [{ name: "invalidJob" }]
		}
	  });
  
	  console.log("Service jobs:", service.jobs);
	  console.log("Console error calls:", consoleSpy.mock.calls);
	  console.log("Logger error calls:", loggerSpy.mock.calls);
	  console.log("Logger warn calls:", warnSpy.mock.calls);
  
	  // Check if the invalid job was ignored
	  expect(service.jobs.size).toBe(0);
  
	  consoleSpy.mockRestore();
	  loggerSpy.mockRestore();
	  warnSpy.mockRestore();
	});
  });

  describe("Test getCronTime method", () => {
    beforeEach(() => {
      service = broker.createService({
        name: "cron",
        mixins: [CronMixin]
      });
    });

    it("should create a CronTime instance", () => {
      const time = "0 5 * * *";
      service.getCronTime(time);
      expect(CronTime).toHaveBeenCalledWith(time);
    });
  });
});