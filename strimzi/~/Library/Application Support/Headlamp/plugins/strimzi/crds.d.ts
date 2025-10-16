export interface ApiError {
    message: string;
}
export interface StrimziStatus {
    conditions?: Array<{
        type: string;
        status: string;
        lastTransitionTime?: string;
        reason?: string;
        message?: string;
    }>;
    observedGeneration?: number;
    listeners?: Array<{
        type: string;
        addresses: Array<{
            host: string;
            port: number;
        }>;
    }>;
    clusterId?: string;
}
export interface KafkaSpec {
    kafka: {
        version?: string;
        replicas: number;
        listeners: Array<{
            name: string;
            port: number;
            type: string;
            tls: boolean;
        }>;
        config?: Record<string, any>;
        storage: {
            type: string;
            size?: string;
            deleteClaim?: boolean;
        };
        metadataVersion?: string;
    };
    zookeeper?: {
        replicas: number;
        storage: {
            type: string;
            size?: string;
            deleteClaim?: boolean;
        };
    };
    entityOperator?: {
        topicOperator?: Record<string, any>;
        userOperator?: Record<string, any>;
    };
}
export interface Kafka {
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
        namespace: string;
        creationTimestamp?: string;
        [key: string]: any;
    };
    spec: KafkaSpec;
    status?: StrimziStatus;
}
export interface KafkaTopicSpec {
    partitions?: number;
    replicas?: number;
    config?: Record<string, any>;
    topicName?: string;
}
export interface KafkaTopic {
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
        namespace: string;
        creationTimestamp?: string;
        [key: string]: any;
    };
    spec: KafkaTopicSpec;
    status?: StrimziStatus;
}
export interface KafkaUserSpec {
    authentication: {
        type: string;
    };
    authorization?: {
        type: string;
        acls?: Array<{
            resource: {
                type: string;
                name?: string;
                patternType?: string;
            };
            operations?: string[];
            host?: string;
        }>;
    };
    quotas?: {
        producerByteRate?: number;
        consumerByteRate?: number;
        requestPercentage?: number;
    };
}
export interface KafkaUser {
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
        namespace: string;
        creationTimestamp?: string;
        [key: string]: any;
    };
    spec: KafkaUserSpec;
    status?: StrimziStatus;
}
export declare function isKRaftMode(kafka: Kafka): boolean;
export declare function getClusterMode(kafka: Kafka): 'KRaft' | 'ZooKeeper';
export declare function isKafkaReady(kafka: Kafka): boolean;
export declare function isTopicReady(topic: KafkaTopic): boolean;
export declare function isUserReady(user: KafkaUser): boolean;
//# sourceMappingURL=crds.d.ts.map