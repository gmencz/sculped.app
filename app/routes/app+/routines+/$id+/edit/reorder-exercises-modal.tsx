import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import type { action, loader } from "./route";
import { XMarkIcon } from "@heroicons/react/20/solid";
import type { SerializeFrom } from "@remix-run/server-runtime";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import clsx from "clsx";
import { classes } from "~/utils/classes";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import { SortableExercise } from "./sortable-exercise";
import type { ReorderExercisesSchema } from "./schema";
import { Intent, reorderExercisesSchema } from "./schema";
import { parse } from "@conform-to/zod";
import { conform, useForm } from "@conform-to/react";

type ReorderExercisesModalProps = {
  exercises: SerializeFrom<typeof loader>["routine"]["exercises"];
  show: boolean;
  setShow: (value: React.SetStateAction<boolean>) => void;
};

export function ReorderExercisesModal({
  exercises,
  show,
  setShow,
}: ReorderExercisesModalProps) {
  return (
    <Transition.Root show={show} as={Fragment}>
      <Dialog
        onClose={() => setShow(false)}
        as="div"
        className="relative z-[60]"
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
          <div className="fixed inset-0 bg-zinc-500 bg-opacity-75 transition-opacity dark:bg-zinc-900 dark:bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative flex w-full transform flex-col overflow-hidden rounded-lg bg-white text-left text-zinc-950 shadow-xl transition-all dark:bg-zinc-950 dark:text-white sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="flex w-full items-center justify-between gap-6 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                  <span className="font-medium">Reorder Exercises</span>
                  <button
                    onClick={() => setShow(false)}
                    className="-m-2 rounded-md p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <ReorderExercisesForm setShow={setShow} exercises={exercises} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

type ReorderExercisesFormProps = {
  setShow: (value: React.SetStateAction<boolean>) => void;
  exercises: SerializeFrom<typeof loader>["routine"]["exercises"];
};

function ReorderExercisesForm({
  setShow,
  exercises,
}: ReorderExercisesFormProps) {
  const navigation = useNavigation();
  const isSubmitting =
    navigation.state === "submitting" &&
    navigation.formData.get("intent") === Intent.REORDER_EXERCISES;
  const [isDragging, setIsDragging] = useState(false);
  const [sortableExercises, setSortableExercises] = useState(exercises);
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Require the mouse to move by 10 pixels before activating
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      // Press delay of 250ms, with tolerance of 5px of movement
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const lastSubmission = useActionData<typeof action>();
  const [form, { intent, orderedExercisesIds }] =
    useForm<ReorderExercisesSchema>({
      id: "reorder-exercises-form",
      lastSubmission,
      defaultValue: {
        intent: Intent.REORDER_EXERCISES,
      },
      onValidate({ formData }) {
        return parse(formData, { schema: reorderExercisesSchema });
      },
    });

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);

    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      setSortableExercises((sortableExercises) => {
        const oldIndex = sortableExercises.findIndex(
          (exercise) => exercise.id === active.id
        );

        const newIndex = sortableExercises.findIndex(
          (exercise) => exercise.id === over.id
        );

        return arrayMove(sortableExercises, oldIndex, newIndex);
      });
    }
  };

  return (
    <Form
      method="post"
      className="relative px-6 pb-4 pt-6"
      preventScrollReset
      replace
      {...form.props}
    >
      <input {...conform.input(intent, { hidden: true })} />

      {sortableExercises.map((exercise, index) => (
        <Fragment key={exercise.id}>
          <input
            type="hidden"
            id={`${form.id}-${orderedExercisesIds.name}[${index}]`}
            name={`${orderedExercisesIds.name}[${index}]`}
            value={exercise.id}
          />
        </Fragment>
      ))}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext
          items={sortableExercises}
          strategy={verticalListSortingStrategy}
        >
          <ol className="flex flex-col gap-6">
            {sortableExercises.map((exercise) => (
              <SortableExercise key={exercise.id} exercise={exercise} />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      <div className="mt-10 flex gap-4">
        <button
          disabled={isSubmitting || isDragging}
          type="submit"
          className={clsx(classes.buttonOrLink.primary, "flex-1")}
        >
          Done
        </button>
        <button
          disabled={isDragging}
          onClick={() => setShow(false)}
          type="button"
          className={clsx(classes.buttonOrLink.secondary, "flex-1")}
        >
          Cancel
        </button>
      </div>
    </Form>
  );
}
