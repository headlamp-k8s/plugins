export const allSparkApplications = [
  {
    metadata: {
      name: 'spark-pi',
      namespace: 'default',
      creationTimestamp: '2025-05-09T10:00:00Z',
      uid: 'spark-pi-uid',
    },
    spec: {
      type: 'Scala',
      mode: 'cluster',
      sparkVersion: '3.1.1',
      mainClass: 'org.apache.spark.examples.SparkPi',
      driver: { cores: 1, memory: '512m' },
      executor: { cores: 1, memory: '512m', instances: 2 },
    },
    status: {
      applicationState: { state: 'RUNNING' },
      driverInfo: { podName: 'spark-pi-driver' },
      executorState: { 'spark-pi-exec-1': 'RUNNING', 'spark-pi-exec-2': 'RUNNING' },
    },
  },
  {
    metadata: {
      name: 'pyspark-job',
      namespace: 'kubeflow',
      creationTimestamp: '2025-05-09T09:00:00Z',
      uid: 'pyspark-job-uid',
    },
    spec: {
      type: 'Python',
      mode: 'cluster',
      sparkVersion: '3.1.1',
      mainApplicationFile: 'local:///opt/spark/examples/src/main/python/pi.py',
      driver: { cores: 1, memory: '1Gi' },
      executor: { cores: 2, memory: '2Gi', instances: 4 },
    },
    status: {
      applicationState: { state: 'COMPLETED' },
      driverInfo: { podName: 'pyspark-job-driver' },
    },
  },
];

export const allScheduledSparkApplications = [
  {
    metadata: {
      name: 'spark-pi-scheduled',
      namespace: 'default',
      creationTimestamp: '2025-05-09T08:00:00Z',
      uid: 'spark-pi-scheduled-uid',
    },
    spec: {
      schedule: '@hourly',
      template: {
        type: 'Scala',
        mode: 'cluster',
        sparkVersion: '3.1.1',
        mainClass: 'org.apache.spark.examples.SparkPi',
      },
    },
    status: {
      scheduleState: 'Scheduled',
      nextRun: '2025-05-09T11:00:00Z',
    },
  },
];
