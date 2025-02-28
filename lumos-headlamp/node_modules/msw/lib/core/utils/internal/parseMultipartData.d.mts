import { d as DefaultRequestMultipartBody } from '../../HttpResponse-Gtw1lt3H.mjs';
import './isIterable.mjs';
import '../../typeUtils.mjs';

/**
 * Parses a given string as a multipart/form-data.
 * Does not throw an exception on an invalid multipart string.
 */
declare function parseMultipartData<T extends DefaultRequestMultipartBody>(data: string, headers?: Headers): T | undefined;

export { parseMultipartData };
