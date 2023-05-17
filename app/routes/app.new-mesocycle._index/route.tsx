import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Form, useActionData } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { requireUser } from "~/session.server";
import { Input } from "~/components/input";
import { Select } from "~/components/select";
import { SubmitButton } from "~/components/submit-button";
import { Heading } from "~/components/heading";
import { Paragraph } from "~/components/paragraph";
import {
  createDraftMesocycle,
  findMesocycleByNameUserId,
} from "~/models/mesocycle.server";
import type { Schema } from "./schema";
import {
  durationInWeeksArray,
  schema,
  trainingDaysPerWeekArray,
} from "./schema";

export const loader = async ({ request }: LoaderArgs) => {
  await requireUser(request);
  return null;
};

export const action = async ({ request }: ActionArgs) => {
  const user = await requireUser(request);
  const formData = await request.formData();
  const submission = parse(formData, { schema });

  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  const { durationInWeeks, goal, name, trainingDaysPerWeek } = submission.value;
  const existingMesocycle = await findMesocycleByNameUserId(name, user.id);

  if (existingMesocycle) {
    submission.error["name"] = "A mesocycle with that name already exists.";
    return json(submission, { status: 400 });
  }

  return createDraftMesocycle(request, {
    durationInWeeks,
    goal,
    name,
    trainingDaysPerWeek,
  });
};

export default function NewMesocycle() {
  const lastSubmission = useActionData();
  const [form, { name, durationInWeeks, goal, trainingDaysPerWeek }] =
    useForm<Schema>({
      id: "new-mesocycle",
      lastSubmission,
      defaultValue: {
        durationInWeeks: "Select weeks",
        trainingDaysPerWeek: "Select days",
      },
      onValidate({ formData }) {
        return parse(formData, { schema });
      },
    });

  return (
    <div className="mx-auto w-full max-w-2xl py-10">
      <Heading>Plan a new mesocycle</Heading>
      <Paragraph>
        A mesocycle is a structured training plan designed to help you achieve
        maximum muscle growth. Here you can build your own to fit your
        preferences and needs.
      </Paragraph>

      <Form
        method="post"
        className="mt-4 bg-white shadow-sm ring-1 ring-zinc-900/5 sm:rounded-xl md:col-span-2"
        {...form.props}
      >
        <div className="flex flex-col gap-6 px-4 py-6 sm:p-8">
          <Input
            config={name}
            label="How do you want to name the mesocycle?"
            placeholder="My New Mesocycle"
            helperText="This cannot be changed later."
          />

          <Select
            config={durationInWeeks}
            options={durationInWeeksArray}
            label="How many weeks will the mesocycle last?"
            helperText="You can repeat the mesocycle once it's over. If you're unsure what to choose, we recommend 12 weeks. This cannot be changed later."
          />

          <Select
            config={trainingDaysPerWeek}
            options={trainingDaysPerWeekArray}
            label="How many days per week will you train?"
            helperText="Please select a realistic number that you can commit to. More isn't better, better is better. This cannot be changed later."
          />

          <Input
            config={goal}
            label="What is the main goal of the mesocycle?"
            placeholder="Overall hypertrophy, bringing up legs..."
            helperText="This cannot be changed later."
          />

          <SubmitButton text="Save and continue" />
        </div>
      </Form>
    </div>
  );
}
