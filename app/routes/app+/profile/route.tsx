import { Dialog, Transition } from "@headlessui/react";
import {
  ArrowLeftOnRectangleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import { Form, useLoaderData } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { format } from "date-fns";
import { Fragment, useRef, useState } from "react";
import { AppPageLayout } from "~/components/app-page-layout";
import { configRoutes } from "~/utils/routes";
import { prisma } from "~/utils/db.server";
import { env } from "~/utils/env.server";
import { signOut } from "~/services/auth/api/sign-out";
import { requireUserId } from "~/services/auth/api/require-user-id";
import { stripe } from "~/services/stripe/config.server";
import type { MatchWithHeader } from "~/utils/hooks";
import { Heading } from "~/components/heading";
import { Paragraph } from "~/components/paragraph";
import { classes } from "~/utils/classes";
import clsx from "clsx";

export const handle: MatchWithHeader = {
  header: () => "Profile",
  links: [],
};

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      createdAt: true,
      subscription: {
        select: { status: true, currentPeriodEnd: true },
      },
    },
  });

  if (!user || !user.subscription) {
    throw await signOut(request);
  }

  const customerPortalLink =
    env.STRIPE_CUSTOMER_PORTAL_LINK +
    `?prefilled_email=${encodeURIComponent(user.email)}`;

  return json({ user, customerPortalLink });
};

export const action = async ({ request }: ActionArgs) => {
  const userId = await requireUserId(request);

  if (request.method === "DELETE") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripeCustomerId: true,
      },
    });

    if (user) {
      if (user.stripeCustomerId) {
        await stripe.customers.del(user.stripeCustomerId);
      }

      await prisma.user.delete({ where: { id: userId }, select: { id: true } });
    }

    return signOut(request);
  }

  throw new Response("Method Not Allowed", { status: 405 });
};

export default function Profile() {
  const { user, customerPortalLink } = useLoaderData<typeof loader>();
  const [open, setOpen] = useState(false);
  const cancelButtonRef = useRef(null);

  return (
    <>
      <AppPageLayout>
        <div className="hidden lg:block">
          <Heading className="text-zinc-900 dark:text-zinc-50">Profile</Heading>
          <Paragraph className="mt-1">
            Your profile's details and subscription.
          </Paragraph>
        </div>

        <dl className="divide-y divide-zinc-200 dark:divide-zinc-700 lg:mt-6 lg:border-t lg:border-zinc-200 lg:dark:border-zinc-700">
          <div className="pb-6 pt-2 sm:grid sm:grid-cols-3 sm:gap-4 lg:pt-6">
            <dt className="text-sm font-medium leading-6 text-zinc-900 dark:text-zinc-50">
              Email
            </dt>
            <dd className="mt-1 text-sm leading-6 text-zinc-700 dark:text-zinc-300 sm:col-span-2 sm:mt-0">
              {user?.email}
            </dd>
          </div>
          <div className="py-6 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium leading-6 text-zinc-900 dark:text-zinc-50">
              Subscription
            </dt>
            <dd className="mt-1 flex text-sm leading-6 text-zinc-700 dark:text-zinc-300 sm:col-span-2 sm:mt-0">
              <div className="flex-grow">
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  {user.subscription!.status}
                </p>
                <p>
                  <span className="font-medium">
                    {user.subscription!.status === "trialing"
                      ? "Trial ends:"
                      : "Current period ends:"}
                  </span>{" "}
                  {format(
                    new Date(user.subscription!.currentPeriodEnd! * 1000),
                    "MMMM' 'd' 'yyyy"
                  )}
                </p>
              </div>

              <span className="ml-4 flex-shrink-0">
                <a
                  href={customerPortalLink}
                  className="rounded-md font-medium text-orange-600 hover:text-orange-500"
                >
                  Manage
                </a>
              </span>
            </dd>
          </div>
          <div className="py-6 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium leading-6 text-zinc-900 dark:text-zinc-50">
              Joined
            </dt>
            <dd className="mt-1 text-sm leading-6 text-zinc-700 dark:text-zinc-300 sm:col-span-2 sm:mt-0">
              {format(new Date(user.createdAt), "MMMM' 'd' 'yyyy")}
            </dd>
          </div>
        </dl>

        <div className="flex items-center gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-700">
          <a
            href={configRoutes.auth.signOut}
            className={classes.buttonOrLink.secondary}
          >
            <ArrowLeftOnRectangleIcon
              className="-ml-0.5 h-5 w-5"
              aria-hidden="true"
            />
            Sign out
          </a>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-red-900 dark:hover:bg-red-950"
          >
            Delete account
          </button>
        </div>
      </AppPageLayout>

      <Transition.Root show={open} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-[60]"
          initialFocus={cancelButtonRef}
          onClose={setOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-zinc-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all dark:bg-zinc-950 sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <Dialog.Title
                        as="h3"
                        className="text-base font-semibold leading-6 text-zinc-900 dark:text-zinc-50"
                      >
                        Delete account
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-zinc-500 dark:text-zinc-300">
                          Are you sure you want to delete your account? All of
                          your data will be permanently removed from our servers
                          forever and your subscription will be immediately
                          canceled. This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <Form replace method="delete">
                      <button
                        type="submit"
                        className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 dark:bg-red-900  dark:hover:bg-red-950 sm:ml-3 sm:w-auto"
                        onClick={() => setOpen(false)}
                      >
                        Delete
                      </button>
                    </Form>
                    <button
                      type="button"
                      className={clsx(
                        classes.buttonOrLink.secondary,
                        "mt-3 w-full sm:mt-0 sm:w-auto"
                      )}
                      onClick={() => setOpen(false)}
                      ref={cancelButtonRef}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}
