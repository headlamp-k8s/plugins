"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable jest/no-export */
/* eslint-disable jest/expect-expect */
const global_1 = require("@storybook/global");
const jest_specific_snapshot_1 = require("jest-specific-snapshot");
const { describe, it } = global_1.global;
function snapshotTest({ item, asyncJest, framework, testMethod, testMethodParams }) {
    const { name } = item;
    const context = { ...item, framework };
    if (asyncJest === true) {
        it(`${name}`, () => new Promise((resolve, reject) => testMethod({
            done: (error) => (error ? reject(error) : resolve()),
            story: item,
            context,
            ...testMethodParams,
        })), testMethod.timeout);
    }
    else {
        it(`${name}`, () => testMethod({
            story: item,
            context,
            ...testMethodParams,
        }), testMethod.timeout);
    }
}
function snapshotTestSuite({ item, suite, ...restParams }) {
    const { kind, children } = item;
    describe(`${suite}`, () => {
        describe(`${kind}`, () => {
            children.forEach((c) => {
                snapshotTest({ item: c, ...restParams });
            });
        });
    });
}
function snapshotsTests({ data, snapshotSerializers, ...restParams }) {
    if (snapshotSerializers) {
        snapshotSerializers.forEach((serializer) => {
            (0, jest_specific_snapshot_1.addSerializer)(serializer);
            expect.addSnapshotSerializer(serializer);
        });
    }
    data.forEach((item) => {
        snapshotTestSuite({ item, ...restParams });
    });
}
exports.default = snapshotsTests;
