import { useForm } from "@conform-to/react";
import type { ActionArgs } from "@remix-run/server-runtime";
import {
  json,
  type LoaderArgs,
  type SerializeFrom,
} from "@remix-run/server-runtime";
import { requireUser } from "~/services/auth/api/require-user";
import { prisma } from "~/utils/db.server";
import type { MatchWithHeader } from "~/utils/hooks";
import type { UpdateLabelSchema } from "./schema";
import {
  addSetSchema,
  removeExerciseSchema,
  schema,
  updateExerciseSchema,
  updateLabelSchema,
  updateSetSchema,
} from "./schema";
import {
  Form,
  useActionData,
  useLoaderData,
  useSubmit,
} from "@remix-run/react";
import { parse } from "@conform-to/zod";
import { Input } from "~/components/input";
import { Heading } from "~/components/heading";
import { useMemo, type FormEvent } from "react";
import { MuscleGroupBadge } from "~/components/muscle-group-badge";
import { TrainingDayExercise } from "./training-day-exercise";
import { classes } from "~/utils/classes";
import clsx from "clsx";
import { redirectBack } from "~/utils/responses.server";
import { configRoutes } from "~/utils/routes";
import { getRepRangeBounds } from "~/utils/rep-ranges";

export const handle: MatchWithHeader<SerializeFrom<typeof loader>> = {
  header: (data) =>
    `${data.trainingDay.mesocycle?.name} - Day ${data.trainingDay.number}`,
  links: [],
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const user = await requireUser(request);
  const { trainingDayId } = params;
  if (!trainingDayId) {
    throw new Error("trainingDayId param is falsy, this should never happen");
  }

  const trainingDay = await prisma.mesocycleTrainingDay.findFirst({
    where: {
      id: trainingDayId,
      mesocycle: {
        userId: user.id,
      },
    },
    select: {
      id: true,
      label: true,
      number: true,
      mesocycle: {
        select: {
          name: true,
        },
      },
      exercises: {
        orderBy: { number: "asc" },
        select: {
          id: true,
          notes: true,
          exercise: {
            select: {
              name: true,
              muscleGroups: {
                select: {
                  name: true,
                },
              },
            },
          },
          sets: {
            orderBy: { number: "asc" },
            select: {
              id: true,
              number: true,
              repRangeLowerBound: true,
              repRangeUpperBound: true,
              weight: true,
              rir: true,
            },
          },
        },
      },
    },
  });

  if (!trainingDay) {
    throw new Response("Not Found", {
      status: 404,
    });
  }

  return json({ trainingDay });
};

export const action = async ({ request }: ActionArgs) => {
  await requireUser(request);
  const formData = await request.formData();
  const intentSubmission = parse(formData, { schema });

  if (!intentSubmission.value || intentSubmission.intent !== "submit") {
    return json(intentSubmission, { status: 400 });
  }

  const { actionIntent } = intentSubmission.value;

  switch (actionIntent) {
    case "update-set": {
      const submission = parse(formData, { schema: updateSetSchema });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const {
        id: setId,
        repRange,
        rir,
        weight,
        wantsToRemove,
      } = submission.value;

      if (wantsToRemove) {
        const deleted = await prisma.mesocycleTrainingDayExerciseSet.delete({
          where: {
            id: setId,
          },
          select: {
            mesocycleTrainingDayExerciseId: true,
            number: true,
          },
        });

        // Update the `number` value for the sets after the one we removed.
        await prisma.mesocycleTrainingDayExerciseSet.updateMany({
          where: {
            AND: [
              {
                mesocycleTrainingDayExerciseId:
                  deleted.mesocycleTrainingDayExerciseId,
              },
              { number: { gt: deleted.number } },
            ],
          },
          data: {
            number: { decrement: 1 },
          },
        });

        return redirectBack(request, {
          fallback: configRoutes.app.mesocycles.list,
        });
      }

      const [repRangeLowerBound, repRangeUpperBound] =
        getRepRangeBounds(repRange);

      await prisma.mesocycleTrainingDayExerciseSet.update({
        where: {
          id: setId,
        },
        data: {
          repRangeLowerBound: { set: repRangeLowerBound },
          repRangeUpperBound: { set: repRangeUpperBound },
          rir: { set: rir },
          weight: { set: weight },
        },
      });

      return redirectBack(request, {
        fallback: configRoutes.app.mesocycles.list,
      });
    }

    case "add-set": {
      const submission = parse(formData, { schema: addSetSchema });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { id, setId } = submission.value;

      const lastSet = await prisma.mesocycleTrainingDayExerciseSet.findFirst({
        where: {
          mesocycleTrainingDayExerciseId: id,
        },
        orderBy: {
          number: "desc",
        },
      });

      await prisma.mesocycleTrainingDayExerciseSet.create({
        data: {
          id: setId,
          mesocycleTrainingDayExercise: { connect: { id } },
          number: lastSet?.number ? lastSet.number + 1 : 1,
          repRangeLowerBound: lastSet?.repRangeLowerBound || 5,
          repRangeUpperBound: lastSet?.repRangeUpperBound || 8,
          weight: lastSet?.weight,
          rir: lastSet?.rir || 0,
        },
      });

      return redirectBack(request, {
        fallback: configRoutes.app.mesocycles.list,
      });
    }

    case "update-exercise": {
      const submission = parse(formData, { schema: updateExerciseSchema });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { id, notes } = submission.value;

      await prisma.mesocycleTrainingDayExercise.update({
        where: {
          id,
        },
        data: {
          notes: { set: notes },
        },
      });

      return redirectBack(request, {
        fallback: configRoutes.app.mesocycles.list,
      });
    }

    case "remove-exercise": {
      const submission = parse(formData, { schema: removeExerciseSchema });

      if (!submission.value || submission.intent !== "submit") {
        return json(submission, { status: 400 });
      }

      const { id } = submission.value;

      await prisma.mesocycleTrainingDayExercise.delete({
        where: {
          id,
        },
      });

      return redirectBack(request, {
        fallback: configRoutes.app.mesocycles.list,
      });
    }

    default: {
      throw new Error("The action intent is not valid");
    }
  }
};

export default function TrainingDay() {
  const { trainingDay } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const lastSubmission = useActionData() as any;
  const [updateLabelForm, { label }] = useForm<UpdateLabelSchema>({
    id: "update-label-form",
    lastSubmission,
    defaultValue: {
      label: trainingDay.label,
    },
    onValidate({ formData }) {
      return parse(formData, { schema: updateLabelSchema });
    },
  });

  const handleFormChange = (event: FormEvent<HTMLFormElement>) => {
    submit(event.currentTarget, { replace: true, preventScrollReset: true });
  };

  const muscleGroups = useMemo(() => {
    const set = new Set<string>();

    trainingDay.exercises.forEach((exercise) => {
      exercise.exercise?.muscleGroups.forEach((muscleGroup) => {
        set.add(muscleGroup.name);
      });
    });

    return Array.from(set);
  }, [trainingDay]);

  return (
    <>
      <div className="bg-zinc-900 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-1 hidden items-center justify-between lg:flex">
            <h2 className="font-medium text-zinc-200">
              {trainingDay.mesocycle?.name} - Day {trainingDay.number}
            </h2>
          </div>

          <Heading white>{trainingDay.label}</Heading>

          <ul className="mt-3 flex flex-wrap gap-2">
            {muscleGroups.map((muscleGroup, index) => (
              <li key={muscleGroup}>
                <MuscleGroupBadge white index={index}>
                  {muscleGroup}
                </MuscleGroupBadge>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 pb-8">
        <div className="mx-auto w-full max-w-2xl">
          <Form
            method="post"
            onChange={handleFormChange}
            replace
            preventScrollReset
            className="px-4 sm:px-6 lg:px-8"
            {...updateLabelForm.props}
          >
            <Input label="Label" config={label} />
          </Form>

          <ol className="mt-6 flex flex-col gap-6">
            {trainingDay.exercises.map((exercise) => (
              <li key={exercise.id}>
                <TrainingDayExercise exercise={exercise} />
              </li>
            ))}
          </ol>

          <div className="px-4 sm:px-6 lg:px-8">
            <button
              className={clsx(classes.buttonOrLink.secondary, "mt-4 w-full")}
            >
              Add exercise
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
