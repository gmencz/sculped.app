import { ArrowLongRightIcon } from "@heroicons/react/20/solid";
import { Link } from "@remix-run/react";
import { useOptionalUser } from "~/utils/hooks";
import { configRoutes } from "~/utils/routes";

export function LegalHeader() {
  const user = useOptionalUser();

  return (
    <header className="mx-auto flex w-full max-w-5xl justify-between p-6">
      <Link
        className="flex h-10 w-10 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-800"
        to={configRoutes.home}
      >
        <img className="h-10 w-10 rounded-full" src="/logo.png" alt="Logo" />
      </Link>

      {user ? (
        <Link
          to={configRoutes.app.current}
          className="rounded-md bg-orange-500 px-5 py-2.5 font-semibold text-white hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
        >
          Open app
        </Link>
      ) : (
        <Link
          to={configRoutes.auth.signIn}
          className="flex items-center gap-2 rounded-md bg-zinc-900 px-5 py-2.5 font-semibold text-white  ring-1 ring-zinc-700 hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-800"
        >
          <span>Sign in</span>
          <ArrowLongRightIcon className="-mr-1 h-5 w-5" />
        </Link>
      )}
    </header>
  );
}
