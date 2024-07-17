import { ServiceSchema, Context } from "moleculer";
import { CronJob as NodeCronJob, CronTime as NodeCronTime } from "cron";

declare module "moleculer" {
    interface ServiceSettingsSchema {
        cronJobs?: CronJobConfig[];
    }

    interface Service {
        jobs?: Map<string, CronJobWrapper>;
    }
}

export interface CronJobConfig {
    name: string;
    cronTime: string | Date;
    onTick: (this: Context) => void | Promise<void>;
    onComplete?: (this: Context) => void;
    start?: boolean;
    timeZone?: string | null;
    context?: any;
    onJobInitialised?: (this: Context) => void;
    utcOffset?: number | null;
    unrefTimeout?: boolean | null;
}

export interface CronJob {
    start: () => void;
    stop: () => void;
    lastDate: () => Date;
    nextDates: (count: number) => Date[];
    fireOnTick: () => void;
    addCallback: (callback: () => void) => void;
    running: boolean;
    cronTime: CronTime;
}

export interface CronTime {
    source: string;
    zone: string;
    _fields: number[];
    _tz: string;
    _utc: boolean;
    _offsets: number[];
}

export interface CronJobWrapper {
    cronJob: CronJob;
    startJob: () => void;
    stopJob: () => void;
    lastDate: () => Date;
    running: () => boolean;
    setTime: (cronTime: string | Date) => void;
    nextDates: (count: number) => Date[];
    addCallback: (callback: () => void) => void;
    manualStart: boolean;
}

export interface CronMixinSchema extends ServiceSchema {
    settings?: {
        cronJobs?: CronJobConfig[];
    };
    methods: {
        validateAndCreateJobs: () => void;
        createJob: (jobConfig: CronJobConfig) => void;
        wrapOnTick: (jobName: string, onTick: CronJobConfig['onTick']) => () => Promise<void>;
        wrapOnComplete: (jobName: string, onComplete?: CronJobConfig['onComplete']) => () => void;
        startJobs: () => void;
        startJob: (name: string) => void;
        stopJob: (name: string) => void;
        getJob: (name: string) => CronJobWrapper | undefined;
        getCronTime: (time: string | Date) => CronTime;
    };
}

declare const CronMixin: CronMixinSchema;

export default CronMixin;

// Extend the 'cron' module declarations
declare module "cron" {
    export class CronJob implements CronJob {
        constructor(
            cronTime: string | Date,
            onTick: () => void,
            onComplete?: () => void,
            start?: boolean,
            timeZone?: string,
            context?: any,
            runOnInit?: boolean,
            utcOffset?: number,
            unrefTimeout?: boolean
        );
    }

    export class CronTime implements CronTime {
        constructor(time: string | Date, zone?: string, utcOffset?: number);
    }
}