"use strict";

const CronMixin = require("../../src");
const { ServiceBroker } = require("moleculer");
const { CronJob, CronTime } = require("cron");

jest.mock("cron");

describe("Test Cron Mixin", () => {
  let broker, service, mockCronJob;

  beforeEach(() => {
    broker = new ServiceBroker({ logger: false });
    mockCronJob = {
      start: jest.fn(),
      stop: jest.fn(),
      lastDate: jest.fn(),
      running: false
    };
    CronJob.mockImplementation((cronTime, onTick, onComplete, start, timeZone, context) => {
      mockCronJob.cronTime = cronTime;
      mockCronJob.onTick = onTick;
      mockCronJob.onComplete = onComplete;
      mockCronJob.timeZone = timeZone;
      mockCronJob.context = context;
      mockCronJob.start = jest.fn(() => {
        mockCronJob.running = true;
        setTimeout(onTick, 1000); // Simulate a tick after 1 second
      });
      mockCronJob.stop = jest.fn(() => {
        mockCronJob.running = false;
      });
      return mockCronJob;
    });
  });

  afterEach(async () => {
    await broker.stop();
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
      cronTime: "*/1 * * * * *", // Every second
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
      expect(CronJob).toHaveBeenCalledWith(
        testJob.cronTime,
        expect.any(Function),
        expect.any(Function),
        false,
        testJob.timeZone,
        expect.any(Object)
      );
    });

    it("should wrap onTick function", async () => {
      const job = service.jobs.get("testJob");
      job.start();
      await new Promise(resolve => setTimeout(resolve, 1100)); // Wait just over 1 second
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
            cronTime: "*/1 * * * * *",
            onTick: jest.fn()
          }]
        }
      });
    });

    it("should start a job", async () => {
      service.startJob("testJob");
      expect(mockCronJob.start).toHaveBeenCalled();
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockCronJob.running).toBe(true);
    });

    it("should stop a job", async () => {
      service.startJob("testJob");
      await new Promise(resolve => setTimeout(resolve, 100));
      service.stopJob("testJob");
      expect(mockCronJob.stop).toHaveBeenCalled();
      expect(mockCronJob.running).toBe(false);
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
    beforeEach(() => {
      service = broker.createService({
        name: "cron",
        mixins: [CronMixin],
        settings: {
          cronJobs: [
            { name: "job1", cronTime: "*/1 * * * * *", onTick: jest.fn() },
            { name: "job2", cronTime: "*/5 * * * * *", onTick: jest.fn(), manualStart: true }
          ]
        }
      });
    });

    it("should start non-manual jobs on service start", async () => {
      await broker.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(service.jobs.get("job1").running).toBe(true);
      expect(service.jobs.get("job2").running).toBe(false);
    });

    it("should stop all jobs on service stop", async () => {
      await broker.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      await broker.stop();
      expect(service.jobs.get("job1").running).toBe(false);
      expect(service.jobs.get("job2").running).toBe(false);
    });
  });

  describe("Test error handling", () => {
    it("should handle invalid job configurations", () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      service = broker.createService({
        name: "cron",
        mixins: [CronMixin],
        settings: {
          cronJobs: [{ name: "invalidJob" }]
        }
      });
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(service.jobs.size).toBe(0);
      consoleSpy.mockRestore();
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