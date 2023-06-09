import type { FieldConfig } from "@conform-to/react";
import { conform } from "@conform-to/react";
import { useInputEvent } from "@conform-to/react";
import { Fragment, useRef, useState } from "react";
import { Combobox, Transition } from "@headlessui/react";
import clsx from "clsx";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { ErrorMessage } from "~/components/error-message";

type ExercisesAutocompleteProps = {
  exerciseNumber: number;
  dayNumber: number;
  exercises: { id: string; name: string }[];
  fieldConfig: FieldConfig<string>;
};

export function ExercisesAutocomplete({
  fieldConfig,
  exercises,
  exerciseNumber,
  dayNumber,
}: ExercisesAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [value, setValue] = useState(fieldConfig.defaultValue ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const [ref, control] = useInputEvent({
    onReset: () => setValue(fieldConfig.defaultValue ?? ""),
  });

  const filteredExercises =
    query === ""
      ? exercises
      : exercises.filter((exercise) =>
          exercise.name
            .toLowerCase()
            .replace(/\s+/g, "")
            .includes(query.toLowerCase().replace(/\s+/g, ""))
        );

  // Because the autocompletes are in a list, if we don't compute the zIndex in order, then the autocompletes
  // will be below the next in the list.
  const zIndex = 20 - exerciseNumber;

  // Generate a unique id for each search input.
  const searchInputId = `exercise-search-${exerciseNumber}-day-${dayNumber}`;

  return (
    <div>
      <input
        ref={ref}
        {...conform.input(fieldConfig, { hidden: true })}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => inputRef.current?.focus()}
      />

      <Combobox as="div" value={value} onChange={control.change}>
        <label
          htmlFor={searchInputId}
          className="flex items-center gap-2 text-sm font-medium leading-6 text-zinc-900"
        >
          <span>Exercise</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/10 text-sm font-semibold leading-6 text-orange-400 ring-1 ring-inset ring-orange-500/20">
            {exerciseNumber}
          </span>
        </label>
        <div className="relative mt-3" style={{ zIndex }}>
          <div
            className={clsx(
              "relative w-full cursor-default overflow-hidden rounded-md bg-white text-left text-sm ring-1 focus-within:ring-2 focus:outline-none",
              fieldConfig.error
                ? "ring-red-500 focus-within:ring-red-600"
                : "ring-zinc-300 focus-within:ring-orange-600"
            )}
          >
            <Combobox.Input
              ref={inputRef}
              id={searchInputId}
              autoComplete="off"
              className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-zinc-900"
              onChange={(event) => setQuery(event.target.value)}
              displayValue={(exerciseId: string) =>
                exercises.find((e) => e.id === exerciseId)?.name ?? ""
              }
              placeholder="Search..."
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-zinc-400"
                aria-hidden="true"
              />
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery("")}
          >
            <Combobox.Options className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {filteredExercises.length === 0 && query !== "" ? (
                <div className="relative cursor-default select-none px-4 py-2 text-zinc-700">
                  No exercises found
                </div>
              ) : (
                filteredExercises.map((exercise) => (
                  <Combobox.Option
                    key={exercise.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? "bg-orange-600 text-white" : "text-zinc-900"
                      }`
                    }
                    value={exercise.id}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {exercise.name}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? "text-white" : "text-orange-600"
                            }`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>

      {fieldConfig.error ? (
        <ErrorMessage id={fieldConfig.id}>{fieldConfig.error}</ErrorMessage>
      ) : null}
    </div>
  );
}
