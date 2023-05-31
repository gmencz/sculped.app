import {
  PencilSquareIcon,
  PlayIcon,
  PlusIcon,
  StopIcon,
} from "@heroicons/react/20/solid";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { AppPageLayout } from "~/components/app-page-layout";
import { Heading } from "~/components/heading";
import { MesocycleOverview } from "~/components/mesocycle-overview";
import { Paragraph } from "~/components/paragraph";
import { configRoutes } from "~/config-routes";
import { getCurrentMesocycle, getMesocycles } from "~/models/mesocycle.server";
import { requireUser } from "~/session.server";

export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request);
  const mesocycles = await getMesocycles(user.id);
  const currentMesocycle = await getCurrentMesocycle(user.id);
  return json({ mesocycles, currentMesocycle });
};

export default function Mesocycles() {
  const { mesocycles, currentMesocycle } = useLoaderData<typeof loader>();

  if (!mesocycles.length) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-32 text-center sm:px-6 lg:px-8">
        <svg
          className="mx-auto h-12 w-12 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-zinc-900">
          Nothing here yet
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Get started by planning a new mesocycle.
        </p>
        <div className="mt-6">
          <Link
            to={configRoutes.mesocycles.newStepOne}
            className="inline-flex w-full justify-center rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            New mesocycle
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AppPageLayout>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <Heading>Mesocycles</Heading>
          <Paragraph>A list of all your mesocycles.</Paragraph>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            to={configRoutes.mesocycles.newStepOne}
            className="block rounded-md bg-orange-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          >
            New mesocycle
          </Link>
        </div>
      </div>

      <ul className="mt-6 flex flex-col gap-6">
        {mesocycles.map((mesocycle) => (
          <li
            key={mesocycle.id}
            className="col-span-1 divide-y divide-zinc-200 rounded-lg bg-white shadow"
          >
            <div className="p-6">
              <div className="flex items-center space-x-3">
                <h3 className="truncate text-sm font-medium text-zinc-900">
                  {mesocycle.name}
                </h3>
                <span className="inline-flex flex-shrink-0 items-center rounded-full bg-orange-50 px-1.5 py-0.5 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
                  {mesocycle.microcycles}{" "}
                  {mesocycle.microcycles === 1 ? "microcycle" : "microcycles"}
                </span>
                {currentMesocycle?.mesocycle &&
                mesocycle.id === currentMesocycle.mesocycle.id ? (
                  <span className="inline-flex flex-shrink-0 items-center rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-orange-600/20">
                    Current
                  </span>
                ) : null}
              </div>
              <div className="mt-2">
                <MesocycleOverview
                  goal={mesocycle.goal}
                  microcycles={mesocycle.microcycles}
                  restDays={mesocycle.restDays.length}
                  trainingDays={mesocycle._count.trainingDays}
                />
              </div>
            </div>

            <div>
              <div className="-mt-px flex divide-x divide-zinc-200">
                <div className="flex w-0 flex-1">
                  {currentMesocycle?.mesocycle &&
                  mesocycle.id === currentMesocycle.mesocycle.id ? (
                    <Link
                      to={`./${mesocycle.id}/stop`}
                      className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent bg-red-100 py-4 text-sm font-semibold text-red-700 hover:bg-red-200"
                    >
                      <span className="hidden xs:block">Stop</span>
                      <StopIcon className="h-5 w-5" aria-hidden="true" />
                    </Link>
                  ) : (
                    <Link
                      to={`./${mesocycle.id}/start`}
                      className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent bg-orange-100 py-4 text-sm font-semibold text-orange-700 hover:bg-orange-200"
                    >
                      <span className="hidden xs:block">Start</span>
                      <PlayIcon className="h-5 w-5" aria-hidden="true" />
                    </Link>
                  )}
                </div>
                <div className="-ml-px flex w-0 flex-1">
                  <Link
                    to={`./${mesocycle.id}`}
                    className="group relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
                  >
                    <PencilSquareIcon
                      className="h-5 w-5 text-zinc-400 group-hover:text-zinc-700"
                      aria-hidden="true"
                    />
                    <span className="hidden xs:block">Edit</span>
                  </Link>
                </div>
                <div className="-ml-px flex w-0 flex-1">
                  <Link
                    to={`./${mesocycle.id}/history`}
                    className="group relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
                  >
                    <svg
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      className="h-5 w-5 text-zinc-400 group-hover:text-zinc-700"
                    >
                      <path d="M24 12c0 6.627-5.373 12-12 12s-12-5.373-12-12h2c0 5.514 4.486 10 10 10s10-4.486 10-10-4.486-10-10-10c-2.777 0-5.287 1.141-7.099 2.977l2.061 2.061-6.962 1.354 1.305-7.013 2.179 2.18c2.172-2.196 5.182-3.559 8.516-3.559 6.627 0 12 5.373 12 12zm-13-6v8h7v-2h-5v-6h-2z" />
                    </svg>
                    <span className="hidden xs:block">History</span>
                  </Link>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </AppPageLayout>
  );
}
