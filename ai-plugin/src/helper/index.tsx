export const formatString = function (a: string, ...args: any) {
  return a.replace(/{(\d+)}/g, function (match, number) {
    return typeof args[number] !== 'undefined' ? args[number] : match;
  });
};
