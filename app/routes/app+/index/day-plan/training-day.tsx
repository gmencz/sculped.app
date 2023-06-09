import { useEffect, useMemo, useState } from "react";
import { useLoaderData } from "@remix-run/react";
import { Heading } from "~/components/heading";
import { MuscleGroupBadge } from "~/components/muscle-group-badge";
import { TrainingDayExercise } from "./training-day-exercise";
import { Calendar } from "../calendar";
import { TrainingDayExerciseReadOnly } from "./training-day-exercise-read-only";
import type { SerializeFrom } from "@remix-run/server-runtime";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import type { CurrentMesocycleState, loader } from "../route";
import { classes } from "~/utils/classes";
import clsx from "clsx";
import { Disclosure } from "@headlessui/react";
import { CheckBadgeIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import { Paragraph } from "~/components/paragraph";
import { FinishOrUpdateTrainingDayModal } from "./finish-or-update-training-day-modal";
import { SuccessToast } from "~/components/success-toast";
import { toast } from "react-hot-toast";
import { getUniqueMuscleGroups } from "~/utils/muscle-groups";

type TrainingDayProps = {
  trainingDay: NonNullable<
    NonNullable<
      (SerializeFrom<typeof loader> & {
        state: CurrentMesocycleState.STARTED;
      })["day"]
    >["trainingDay"]
  >;
  mesocycleName: string;
  microcycleNumber: number;
  dayNumber: number;
  date: Date;
};

export function TrainingDay({
  trainingDay,
  mesocycleName,
  microcycleNumber,
  dayNumber,
  date,
}: TrainingDayProps) {
  const muscleGroups = useMemo(
    () => getUniqueMuscleGroups(trainingDay.exercises),
    [trainingDay.exercises]
  );

  const {
    readOnly,
    trainingDaySessionFinished,
    trainingDaySessionUpdated,
    isFutureSession,
  } = useLoaderData<
    SerializeFrom<typeof loader> & {
      state: CurrentMesocycleState.STARTED;
    }
  >();

  const canFinishSession = useMemo(
    () =>
      trainingDay.exercises.every((exercise) =>
        exercise.sets.every((set) => set.completed)
      ),
    [trainingDay.exercises]
  );

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (trainingDaySessionFinished) {
      toast.custom(
        (t) => (
          <SuccessToast
            t={t}
            title="Success!"
            description="Training session complete! Great job! Keep it up!"
          />
        ),
        { duration: 10000, id: trainingDaySessionFinished }
      );
      setShowModal(false);
    } else if (trainingDaySessionUpdated) {
      toast.custom(
        (t) => (
          <SuccessToast
            t={t}
            title="Success!"
            description="The training session has been updated."
          />
        ),
        { duration: 5000, id: trainingDaySessionUpdated }
      );
      setShowModal(false);
    }
  }, [trainingDaySessionFinished, trainingDaySessionUpdated]);

  return (
    <>
      <div className="border-b border-zinc-200 bg-zinc-900 px-4 py-6 dark:border-zinc-800 dark:bg-zinc-950 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-1 flex items-center justify-between">
            <div className="hidden lg:block">
              {isToday(date) ? (
                <h2 className="mb-1 font-medium text-zinc-200">
                  {mesocycleName} - M{microcycleNumber} D{dayNumber} - Today
                </h2>
              ) : isTomorrow(date) ? (
                <h2 className="mb-1 font-medium text-zinc-200">
                  {mesocycleName} - M{microcycleNumber} D{dayNumber} - Tomorrow
                </h2>
              ) : isYesterday(date) ? (
                <h2 className="mb-1 font-medium text-zinc-200">
                  {mesocycleName} - M{microcycleNumber} D{dayNumber} - Yesterday
                </h2>
              ) : (
                <h2 className="mb-1 font-medium text-zinc-200">
                  {mesocycleName} - M{microcycleNumber} D{dayNumber} -{" "}
                  {format(date, "MMMM' 'd' 'yyyy")}
                </h2>
              )}
            </div>

            <h2 className="mb-1 font-medium text-zinc-200 lg:hidden">
              {mesocycleName} - M{microcycleNumber} D{dayNumber}
            </h2>

            <Calendar />
          </div>

          <Heading className="text-white">{trainingDay.label}</Heading>

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

      <div className="bg-zinc-50 pb-6 dark:bg-zinc-900">
        {trainingDay.completed ? (
          <div className="mx-auto flex w-full max-w-2xl items-center gap-4 bg-green-100 px-4 py-2 text-sm font-semibold leading-6 text-green-900 dark:bg-green-900 dark:text-green-300 sm:px-6 lg:px-8">
            <span>Completed</span>
            <CheckBadgeIcon className="h-5 w-5" />
          </div>
        ) : null}

        {trainingDay.feedback ? (
          <div className="mx-auto w-full max-w-2xl">
            <Disclosure>
              {({ open }) => (
                <>
                  <Disclosure.Button className="flex w-full items-center justify-between gap-2 bg-orange-50 px-4 py-4 text-sm font-semibold leading-6 text-orange-900 hover:bg-orange-100 dark:bg-orange-950 dark:text-orange-200 hover:dark:bg-orange-900 sm:px-6 lg:px-8">
                    <span>Your feedback</span>

                    <div>
                      <ChevronUpIcon
                        className={clsx(
                          "h-5 w-5 transform text-orange-500",
                          open ? "rotate-180" : "rotate-90"
                        )}
                      />
                    </div>
                  </Disclosure.Button>

                  <Disclosure.Panel className="border-b border-zinc-300 bg-white px-4 py-2 dark:border-zinc-700 dark:bg-zinc-950 sm:px-6 lg:px-8">
                    <Paragraph>{trainingDay.feedback}</Paragraph>
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          </div>
        ) : null}

        <ol className="flex flex-col gap-6 sm:mt-6">
          {trainingDay.exercises.map((exercise) =>
            readOnly ? (
              <TrainingDayExerciseReadOnly
                key={exercise.id}
                exercise={exercise}
              />
            ) : (
              <TrainingDayExercise key={exercise.id} exercise={exercise} />
            )
          )}
        </ol>

        {readOnly || isFutureSession ? null : (
          <div className="mt-6 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-2xl">
              <button
                type="button"
                disabled={!canFinishSession}
                onClick={() => setShowModal(true)}
                className={clsx(
                  classes.buttonOrLink.primary,
                  "w-full transition-all"
                )}
              >
                {trainingDay.completed ? "Update session" : "Finish session"}
              </button>
            </div>
          </div>
        )}
      </div>

      {readOnly || isFutureSession ? null : (
        <FinishOrUpdateTrainingDayModal
          show={showModal}
          onClose={() => setShowModal(false)}
          trainingDay={trainingDay}
        />
      )}
    </>
  );
}
