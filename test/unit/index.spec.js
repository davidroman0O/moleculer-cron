const CronMixin = require("../../src");
const { ServiceBroker } = require("moleculer");

describe("Test Cron Mixin", () => {
  let broker, service;

  beforeEach(() => {
    broker = new ServiceBroker({ logger: false });
  });

  afterEach(async () => {
    await broker.stop();
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

  describe("Test Cron job creation and management", () => {
    const testJob = {
      name: "testJob",
      cronTime: "*/1 * * * * *", // Every second
      onTick: jest.fn(),
      timeZone: "America/New_York"
    };

    beforeEach(async () => {
      service = broker.createService({
        name: "cron",
        mixins: [CronMixin],
        settings: {
          cronJobs: [testJob]
        }
      });
      await broker.start();
    });

    it("should create a job", async () => {
      expect(service.jobs.size).toBe(1);
      expect(service.jobs.has("testJob")).toBeTruthy();
    });

    it("should start and stop a job", async () => {
      const job = service.jobs.get("testJob");
      
      expect(job.running()).toBe(true);
      
      service.stopJob("testJob");
      expect(job.running()).toBe(false);
      
      service.startJob("testJob");
      expect(job.running()).toBe(true);
    });

    it("should handle non-existent job operations gracefully", async () => {
      const logSpy = jest.spyOn(service.logger, 'warn');
      
      service.startJob("nonExistentJob");
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Attempted to start non-existent job"));
      
      service.stopJob("nonExistentJob");
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Attempted to stop non-existent job"));
    });
  });

  describe("Test service lifecycle", () => {
    beforeEach(async () => {
      service = broker.createService({
        name: "cron",
        mixins: [CronMixin],
        settings: {
          cronJobs: [
            { name: "job1", cronTime: "*/1 * * * * *", onTick: jest.fn() },
            { name: "job2", cronTime: "*/2 * * * * *", onTick: jest.fn(), manualStart: true }
          ]
        }
      });
      await broker.start();
    });

    it("should start non-manual jobs on service start and stop all jobs on service stop", async () => {
      expect(service.jobs.get("job1").running()).toBe(true);
      expect(service.jobs.get("job2").running()).toBe(false);
      
      await broker.stop();
      
      // After stopping the broker, jobs should still exist but not be running
      expect(service.jobs.get("job1")).toBeDefined();
      expect(service.jobs.get("job2")).toBeDefined();
      expect(service.jobs.get("job1").running()).toBe(false);
      expect(service.jobs.get("job2").running()).toBe(false);
    });

    it("should allow manual start of jobs", async () => {
      service.startJob("job2");
      expect(service.jobs.get("job2").running()).toBe(true);
    });
  });

  describe("Test error handling", () => {
    it("should handle invalid job configurations", async () => {
      const logSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      service = broker.createService({
        name: "cron",
        mixins: [CronMixin],
        settings: {
          cronJobs: [{ name: "invalidJob" }]
        }
      });
      
      await broker.start();
      
      expect(logSpy).toHaveBeenCalled();
      expect(service.jobs.size).toBe(0);
      
      logSpy.mockRestore();
    });
  });

  describe("Test job methods", () => {
    beforeEach(async () => {
      service = broker.createService({
        name: "cron",
        mixins: [CronMixin],
        settings: {
          cronJobs: [
            { name: "job1", cronTime: "*/1 * * * * *", onTick: jest.fn() }
          ]
        }
      });
      await broker.start();
    });

    it("should return last date", async () => {
      const job = service.jobs.get("job1");
      expect(job.lastDate()).toBeDefined();
    });

    it("should get job by name", async () => {
      const job = service.getJob("job1");
      expect(job).toBeDefined();
      expect(job.name).toBe("job1");
      expect(job.cronJob).toBeDefined();
      expect(typeof job.startJob).toBe('function');
      expect(typeof job.stopJob).toBe('function');
      expect(typeof job.lastDate).toBe('function');
      expect(typeof job.running).toBe('function');
    });
  });
});