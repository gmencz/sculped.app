import { useMemo } from "react";
import type { CurrentMesocycleStartedData } from "../route";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import type { Schema } from "../schema";
import { actionIntents, schema } from "../schema";
import { Heading } from "~/components/heading";
import { MuscleGroupBadge } from "~/components/muscle-group-badge";
import { SubmitButton } from "~/components/submit-button";
import { TrainingDayExercise } from "./training-day-exercise";
import { Calendar } from "../calendar";
import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { TrainingDayExerciseReadOnly } from "./training-day-exercise-read-only";

type TrainingDayProps = {
  trainingDay: NonNullable<CurrentMesocycleStartedData["day"]["trainingDay"]>;
  mesocycleName: string;
  microcycleNumber: number;
  dayNumber: number;
};

export function TrainingDay({
  trainingDay,
  mesocycleName,
  microcycleNumber,
  dayNumber,
}: TrainingDayProps) {
  const muscleGroups = useMemo(() => {
    const set = new Set<string>();

    trainingDay.exercises.forEach((exercise) => {
      exercise.exercise.muscleGroups.forEach((muscleGroup) => {
        set.add(muscleGroup.name);
      });
    });

    return Array.from(set);
  }, [trainingDay]);

  const navigation = useNavigation();

  const isSubmitting =
    navigation.state === "submitting" &&
    navigation.formData.get("actionIntent") === actionIntents[1];

  const lastSubmission = useActionData();
  const [form, { actionIntent }] = useForm<Schema>({
    id: "finish-session",
    lastSubmission,
    defaultValue: {
      actionIntent: actionIntents[1],
    },
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
  });

  const { readOnly } = useLoaderData<CurrentMesocycleStartedData>();

  const canFinishSession = useMemo(
    () =>
      trainingDay.exercises.every((exercise) =>
        exercise.sets.every((set) => set.completed)
      ),
    [trainingDay.exercises]
  );

  return (
    <>
      <div className="bg-zinc-900 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto w-full max-w-2xl">
          <div className="flex items-center justify-between">
            {readOnly ? (
              <h2 className="mb-1 font-medium text-zinc-200">
                {mesocycleName} - M{microcycleNumber} D{dayNumber}
              </h2>
            ) : (
              <h2 className="mb-1 font-medium text-zinc-200">
                {mesocycleName} - M{microcycleNumber} D{dayNumber} - Today
              </h2>
            )}

            <Calendar />
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

      <div className="bg-zinc-50 sm:mt-6">
        <ol className="flex flex-col gap-6">
          {trainingDay.exercises.map((exercise) => (
            <li key={exercise.id}>
              {readOnly ? (
                <TrainingDayExerciseReadOnly
                  completedDay={trainingDay.completed}
                  exercise={exercise}
                />
              ) : (
                <TrainingDayExercise exercise={exercise} />
              )}
            </li>
          ))}
        </ol>

        {readOnly ? null : (
          <Form
            method="post"
            className="mt-6 px-4 pb-12 sm:px-6 lg:px-8"
            {...form.props}
          >
            <div className="mx-auto w-full max-w-2xl">
              <input {...conform.input(actionIntent, { hidden: true })} />

              <SubmitButton
                isSubmitting={isSubmitting}
                disabled={!canFinishSession}
                text="Finish session"
              />
            </div>
          </Form>
        )}
      </div>
    </>
  );
}