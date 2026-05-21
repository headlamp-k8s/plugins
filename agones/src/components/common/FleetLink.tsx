import { Router } from '@kinvolk/headlamp-plugin/lib';

export function FleetLink({
  namespace,
  name,
}: {
  namespace: string;
  name: string;
}) {
  const url = Router.createRouteURL('agones-fleet', {
    namespace,
    name,
  });

  return (
    <a
      href={url}
      onClick={e => e.preventDefault()}
    >
      {name}
    </a>
  );
}