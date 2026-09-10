type Page<T> = {
  packages: T[];
  total?: number;
};

export async function fetchAllPages<T>(
  fetchPage: (offset: number) => Promise<Page<T>>,
  pageSize: number
) {
  let allPackages: T[] = [];
  let offset = 0;

  while (true) {
    const { packages, total } = await fetchPage(offset);
    allPackages = [...allPackages, ...packages];
    offset += pageSize;

    if (packages.length < pageSize) {
      break;
    }

    if (total !== undefined && offset >= total) {
      break;
    }
  }

  return allPackages;
}
