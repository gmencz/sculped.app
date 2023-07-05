import { z } from "zod";
import { exerciseNameSchema, muscleGroupNameSchema } from "~/utils/schemas";
import { asNullableField } from "~/utils/zod";

export const schema = z.object({
  name: exerciseNameSchema,
  primaryMuscleGroup: muscleGroupNameSchema,
  otherMuscleGroups: asNullableField(
    z.array(muscleGroupNameSchema, {
      invalid_type_error: "Invalid other muscle groups.",
    })
  ),
});

export type Schema = z.TypeOf<typeof schema>;
