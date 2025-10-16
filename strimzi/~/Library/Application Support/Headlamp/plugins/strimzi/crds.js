"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isKRaftMode = isKRaftMode;
exports.getClusterMode = getClusterMode;
exports.isKafkaReady = isKafkaReady;
exports.isTopicReady = isTopicReady;
exports.isUserReady = isUserReady;
// Helper functions
function isKRaftMode(kafka) {
    return !kafka.spec.zookeeper;
}
function getClusterMode(kafka) {
    return isKRaftMode(kafka) ? 'KRaft' : 'ZooKeeper';
}
function isKafkaReady(kafka) {
    const condition = kafka.status?.conditions?.find((c) => c.type === 'Ready');
    return condition?.status === 'True';
}
function isTopicReady(topic) {
    const condition = topic.status?.conditions?.find((c) => c.type === 'Ready');
    return condition?.status === 'True';
}
function isUserReady(user) {
    const condition = user.status?.conditions?.find((c) => c.type === 'Ready');
    return condition?.status === 'True';
}
//# sourceMappingURL=crds.js.map