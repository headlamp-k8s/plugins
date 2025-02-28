module.exports = async function promiseMapSeries(array, iterator, thisArg) {
  const length = array.length;
  const cb = arguments.length > 2 ? iterator.bind(thisArg) : iterator;
  const results = new Array(length);

  for (let i = 0; i < length; ++i) {
    results[i] = await cb(array[i], i, array);
  }

  return results;
}
