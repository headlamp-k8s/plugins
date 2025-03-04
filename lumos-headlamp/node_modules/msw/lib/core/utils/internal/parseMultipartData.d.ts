import { d as DefaultRequestMultipartBody } from '../../HttpResponse-DE19n76Q.js';
import './isIterable.js';
import '../../typeUtils.js';

/**
 * Parses a given string as a multipart/form-data.
 * Does not throw an exception on an invalid multipart string.
 */
declare function parseMultipartData<T extends DefaultRequestMultipartBody>(data: string, headers?: Headers): T | undefined;

export { parseMultipartData };
