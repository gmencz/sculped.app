import { z } from "zod";
import { idSchema } from "~/utils/schemas";

export const searchSchema = z.object({
  query: z
    .string({
      invalid_type_error: "The query is not valid.",
      required_error: "The query is required.",
    })
    .refine(
      (query) => {
        if (query === "") return true;
        if (query.length > 100) return false;
        return /^[a-z0-9\s]+$/i.test(query);
      },
      { message: "The query is not valid." }
    ),
});

export type SearchSchema = z.TypeOf<typeof searchSchema>;

export const addExerciseSchema = z.object({
  id: idSchema,
});

export type AddExerciseSchema = z.TypeOf<typeof addExerciseSchema>;
