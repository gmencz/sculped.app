import { Form, useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { getSession, requireUser } from "~/session.server";
import type { Schema as DraftMesocycleSchema } from "./app.new-mesocycle._index";
import { CalendarDaysIcon } from "@heroicons/react/20/solid";
import { z } from "zod";
import type { FieldConfig } from "@conform-to/react";
import { conform, useFieldList, useFieldset, useForm } from "@conform-to/react";
import clsx from "clsx";
import { useRef } from "react";
import { CalendarIcon } from "@heroicons/react/24/outline";

export const loader = async ({ request }: LoaderArgs) => {
  await requireUser(request);
  const url = new URL(request.url);
  const draftMesocycleId = url.searchParams.get("draft_id");
  if (!draftMesocycleId) {
    return redirect("/app/new-mesocycle");
  }

  const session = await getSession(request);
  const mesocycleDetails = (await session.get(
    `draft-mesocycle-${draftMesocycleId}`
  )) as DraftMesocycleSchema;

  return json({
    mesocycleDetails,
  });
};

const schema = z.object({
  trainingDays: z.array(
    z.object({
      label: z
        .string({
          invalid_type_error: "The label is not valid.",
          required_error: "The label is required.",
        })
        .min(1, "The label is required.")
        .max(50, "The label must be at most 50 characters long."),

      muscleGroups: z
        .string({
          invalid_type_error: "Muscle groups is not valid.",
          required_error: "Muscle groups is required.",
        })
        .min(1, "Muscle groups is required.")
        .max(200, "Muscle groups must be at most 200 characters long."),
    })
  ),
});

type Schema = z.infer<typeof schema>;

export default function NewMesocycleDesign() {
  const { mesocycleDetails } = useLoaderData<typeof loader>();

  const [form, { trainingDays }] = useForm<Schema>({
    defaultValue: {
      trainingDays: Array.from(
        { length: mesocycleDetails.trainingDaysPerWeek },
        () => ({ label: "", muscleGroups: "" })
      ),
    },
  });

  const trainingDaysList = useFieldList(form.ref, trainingDays);

  return (
    <>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold leading-7 text-zinc-900 sm:truncate sm:text-3xl sm:tracking-tight">
          {mesocycleDetails.name}
        </h1>
        <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <CalendarDaysIcon
              className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
              aria-hidden="true"
            />
            {mesocycleDetails.durationInWeeks} weeks
          </div>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
              fill="currentColor"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path d="M6 12c0 2.206 1.794 4 4 4 1.761 0 3.242-1.151 3.775-2.734l2.224-1.291.001.025c0 3.314-2.686 6-6 6s-6-2.686-6-6 2.686-6 6-6c1.084 0 2.098.292 2.975.794l-2.21 1.283c-.248-.048-.503-.077-.765-.077-2.206 0-4 1.794-4 4zm4-2c-1.105 0-2 .896-2 2s.895 2 2 2 2-.896 2-2l-.002-.015 3.36-1.95c.976-.565 2.704-.336 3.711.159l4.931-2.863-3.158-1.569.169-3.632-4.945 2.87c-.07 1.121-.734 2.736-1.705 3.301l-3.383 1.964c-.29-.163-.621-.265-.978-.265zm7.995 1.911l.005.089c0 4.411-3.589 8-8 8s-8-3.589-8-8 3.589-8 8-8c1.475 0 2.853.408 4.041 1.107.334-.586.428-1.544.146-2.18-1.275-.589-2.69-.927-4.187-.927-5.523 0-10 4.477-10 10s4.477 10 10 10c5.233 0 9.521-4.021 9.957-9.142-.301-.483-1.066-1.061-1.962-.947z" />
            </svg>
            {mesocycleDetails.goal}
          </div>

          <div className="mt-2 flex items-center text-sm text-gray-500">
            <CalendarIcon
              className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
              aria-hidden="true"
            />
            {mesocycleDetails.trainingDaysPerWeek} days per week
          </div>
        </div>
      </div>

      <Form method="post" className="mt-6" {...form.props}>
        <ul className="flex flex-wrap gap-6">
          {trainingDaysList.map((trainingDay, index) => (
            <li
              className="max-w-sm flex-grow rounded border border-zinc-200 bg-white sm:min-w-[18rem]"
              key={trainingDay.key}
            >
              <TrainingDayFieldset dayNumber={index + 1} config={trainingDay} />
            </li>
          ))}
        </ul>
      </Form>
    </>
  );
}

type TrainingDayFieldsetProps = {
  config: FieldConfig<Schema["trainingDays"][number]>;
  dayNumber: number;
};

function TrainingDayFieldset(props: TrainingDayFieldsetProps) {
  const ref = useRef<HTMLFieldSetElement>(null);
  const { label, muscleGroups } = useFieldset(ref, props.config);

  return (
    <fieldset ref={ref}>
      <div className="border-b border-zinc-200 px-4 py-5 sm:px-6">
        <p className="text-base font-semibold leading-6 text-zinc-900">
          Training Day {props.dayNumber}
        </p>
      </div>

      <div className="px-4 py-5 sm:px-6">
        <div>
          <label
            htmlFor={label.id}
            className="block text-sm font-medium leading-6 text-zinc-900"
          >
            Label
          </label>
          <div className="mt-2">
            <input
              className={clsx(
                "block w-full rounded-md border-0 py-1.5 text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:leading-6",
                label.error
                  ? "text-red-300 ring-red-500 focus:ring-red-600"
                  : "focus:ring-orange-600"
              )}
              placeholder="Push A, Upper A..."
              {...conform.input(label, { type: "text" })}
            />
          </div>
          {label.error ? (
            <p
              className="mt-2 text-xs text-red-500"
              id={label.errorId}
              role="alert"
            >
              {label.error}
            </p>
          ) : null}
        </div>

        <div className="mt-6">
          <label
            htmlFor={muscleGroups.id}
            className="block text-sm font-medium leading-6 text-zinc-900"
          >
            Target muscle groups
          </label>
          <div className="mt-2">
            <input
              className={clsx(
                "block w-full rounded-md border-0 py-1.5 text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:leading-6",
                muscleGroups.error
                  ? "text-red-300 ring-red-500 focus:ring-red-600"
                  : "focus:ring-orange-600"
              )}
              placeholder="Chest, Triceps, Shoulders..."
              {...conform.input(muscleGroups, { type: "text" })}
            />
          </div>
          {muscleGroups.error ? (
            <p
              className="mt-2 text-xs text-red-500"
              id={muscleGroups.errorId}
              role="alert"
            >
              {muscleGroups.error}
            </p>
          ) : null}
        </div>
      </div>
    </fieldset>
  );
}