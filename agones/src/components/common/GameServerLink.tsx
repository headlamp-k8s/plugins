import { Router } from '@kinvolk/headlamp-plugin/lib';

export function GameServerLink({
  name,
  namespace,
}: {
  name?: string | null;
  namespace?: string | null;
}) {
  if (!name || !namespace) return <>-</>;

  const url = Router.createRouteURL('agones-gameserver', {
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