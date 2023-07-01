import { NavLink, Outlet, useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import clsx from "clsx";
import type { PropsWithChildren, SVGAttributes } from "react";
import { useEffect } from "react";
import { configRoutes } from "~/utils/routes";
import { requireUser } from "~/services/auth/api/require-user";
import { commitSession, getGlobalNotification } from "~/utils/session.server";
import { SuccessToast } from "~/components/success-toast";
import { toast } from "react-hot-toast";
import { ErrorToast } from "~/components/error-toast";
import { HomeIcon, UserCircleIcon } from "@heroicons/react/24/solid";

const navigation = [
  {
    name: "Home",
    href: configRoutes.app.home,
    icon: HomeIcon,
    end: true,
  },
  {
    name: "Exercises",
    href: configRoutes.app.exercises,
    icon: (props: SVGAttributes<SVGElement>) => (
      <svg
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 485.535 485.535"
        {...props}
      >
        <g>
          <g id="_x35__13_">
            <g>
              <path
                d="M55.465,123.228c-15.547,0-28.159,12.608-28.159,28.161v56.673C11.653,211.908,0,225.928,0,242.765
         c0,16.842,11.652,30.861,27.306,34.707v56.666c0,15.555,12.612,28.16,28.159,28.16c15.546,0,28.16-12.605,28.16-28.16V151.389
         C83.625,135.837,71.011,123.228,55.465,123.228z"
              />
              <path
                d="M334.498,65.278c-23.092,0-41.811,18.719-41.811,41.812v93.864h-12.801h-60.585h-19.625l-6.827-0.163V107.09
         c0-23.092-18.72-41.812-41.813-41.812c-23.091,0-41.812,18.719-41.812,41.812v271.355c0,23.093,18.721,41.812,41.812,41.812
         c23.094,0,41.813-18.719,41.813-41.812v-93.653c0,0,4.501-0.211,6.827-0.211h19.625h60.585h12.801v93.864
         c0,23.093,18.719,41.812,41.811,41.812c23.094,0,41.812-18.719,41.812-41.812V107.089
         C376.311,83.998,357.592,65.278,334.498,65.278z"
              />
              <path
                d="M458.229,208.062v-56.673c0-15.552-12.613-28.161-28.158-28.161c-15.547,0-28.16,12.608-28.16,28.161v182.749
         c0,15.555,12.613,28.16,28.16,28.16c15.545,0,28.158-12.605,28.158-28.16v-56.666c15.654-3.846,27.307-17.865,27.307-34.707
         C485.535,225.927,473.883,211.908,458.229,208.062z"
              />
            </g>
          </g>
        </g>
      </svg>
    ),
  },
  {
    name: "Profile",
    href: configRoutes.app.profile,
    icon: UserCircleIcon,
  },
];

const mobileNavigation = [
  {
    name: "Home",
    href: configRoutes.app.home,
    icon: HomeIcon,
    end: true,
  },
  {
    name: "Exercises",
    href: configRoutes.app.exercises,
    icon: (props: SVGAttributes<SVGElement>) => (
      <svg
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 485.535 485.535"
        {...props}
      >
        <g>
          <g id="_x35__13_">
            <g>
              <path
                d="M55.465,123.228c-15.547,0-28.159,12.608-28.159,28.161v56.673C11.653,211.908,0,225.928,0,242.765
         c0,16.842,11.652,30.861,27.306,34.707v56.666c0,15.555,12.612,28.16,28.159,28.16c15.546,0,28.16-12.605,28.16-28.16V151.389
         C83.625,135.837,71.011,123.228,55.465,123.228z"
              />
              <path
                d="M334.498,65.278c-23.092,0-41.811,18.719-41.811,41.812v93.864h-12.801h-60.585h-19.625l-6.827-0.163V107.09
         c0-23.092-18.72-41.812-41.813-41.812c-23.091,0-41.812,18.719-41.812,41.812v271.355c0,23.093,18.721,41.812,41.812,41.812
         c23.094,0,41.813-18.719,41.813-41.812v-93.653c0,0,4.501-0.211,6.827-0.211h19.625h60.585h12.801v93.864
         c0,23.093,18.719,41.812,41.811,41.812c23.094,0,41.812-18.719,41.812-41.812V107.089
         C376.311,83.998,357.592,65.278,334.498,65.278z"
              />
              <path
                d="M458.229,208.062v-56.673c0-15.552-12.613-28.161-28.158-28.161c-15.547,0-28.16,12.608-28.16,28.161v182.749
         c0,15.555,12.613,28.16,28.16,28.16c15.545,0,28.158-12.605,28.158-28.16v-56.666c15.654-3.846,27.307-17.865,27.307-34.707
         C485.535,225.927,473.883,211.908,458.229,208.062z"
              />
            </g>
          </g>
        </g>
      </svg>
    ),
  },
  {
    name: "Profile",
    href: configRoutes.app.profile,
    icon: UserCircleIcon,
  },
];

export const loader = async ({ request }: LoaderArgs) => {
  await requireUser(request);
  const { session, notification } = await getGlobalNotification(request);
  return json(
    { notification },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
};

function Layout({ children }: PropsWithChildren) {
  const { notification } = useLoaderData<typeof loader>();

  useEffect(() => {
    if (notification) {
      switch (notification.type) {
        case "success": {
          toast.custom(
            (t) => <SuccessToast t={t} description={notification.message} />,
            { duration: 5000, id: notification.id }
          );

          break;
        }

        case "error": {
          toast.custom(
            (t) => <ErrorToast t={t} description={notification.message} />,
            { duration: 5000, id: notification.id }
          );

          break;
        }
      }
    }
  }, [notification]);

  return (
    <>
      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex h-16 shrink-0 items-center gap-4">
            <img
              className="h-9 w-auto rounded-md dark:border dark:border-zinc-700"
              src="/logo.png"
              alt=""
            />
            <span className="text-lg font-black uppercase tracking-widest text-zinc-950 dark:text-white">
              Sculped
            </span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    end={item.end}
                    to={item.href}
                    className={({ isActive }) =>
                      clsx(
                        isActive
                          ? "bg-orange-100 text-orange-600 dark:bg-zinc-900 dark:text-orange-600"
                          : "text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-300",
                        "group flex gap-x-3 rounded-md p-2 text-base font-medium leading-6"
                      )
                    }
                  >
                    <item.icon
                      className="h-6 w-6 shrink-0"
                      aria-hidden="true"
                    />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 z-50 w-full border-t border-zinc-900/10 bg-white shadow-lg dark:border-zinc-50/10 dark:bg-zinc-950 lg:hidden">
        <nav className="mx-auto w-full max-w-md">
          <ul
            style={{
              gridTemplateColumns: `repeat(${mobileNavigation.length}, 1fr)`,
            }}
            className="grid place-items-center gap-1 xs:gap-2 sm:gap-4"
          >
            {mobileNavigation.map((item) => (
              <li key={item.name} className="w-full">
                <NavLink
                  end={item.end}
                  to={item.href}
                  className={({ isActive }) =>
                    clsx(
                      isActive
                        ? "border-orange-600 text-orange-600"
                        : "border-white text-zinc-400 dark:border-zinc-950 dark:text-zinc-600",
                      "group flex flex-col items-center justify-center border-t-2 pb-2 pt-4 font-semibold leading-6"
                    )
                  }
                >
                  <item.icon className="mb-2 h-7 w-7 shrink-0" />
                  <span className="sr-only">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <main className="min-h-full bg-zinc-100 pb-16 text-zinc-950 dark:bg-zinc-900 dark:text-white lg:pb-0 lg:pl-72">
        {children}
      </main>
    </>
  );
}

export default function App() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
