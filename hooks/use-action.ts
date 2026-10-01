"use client";

// React & Next
import { useTransition } from "react";

// packages
import { toast } from "sonner";

// utils
import { baseActionErrors, networkError } from "@/utils/action-errors";

// types
import type {
  ActionCustomError,
  ActionData,
  ActionError,
  ActionInput,
  ActionResult,
  AnyAction,
} from "@/types/action";

// arabic text is required for every action-specific code, so a new code can't ship without a message
type ErrorMessages<A extends AnyAction> = [ActionCustomError<A>] extends [never]
  ? { errors?: never }
  : { errors: Record<ActionCustomError<A>, string> };

type UseActionOptions<A extends AnyAction> = ErrorMessages<A> & {
  // loading toast that turns into the result in place; use for actions slower than ~300 ms, not for ones that redirect
  loading?: string;
  success?: string | ((data: ActionData<A>) => string);
  onSuccess?: (data: ActionData<A>) => void;
  onError?: (error: ActionError<A>) => void;
};

// options are required only when the action has its own error codes
type OptionsArg<A extends AnyAction> = [ActionCustomError<A>] extends [never]
  ? [options?: UseActionOptions<A>]
  : [options: UseActionOptions<A>];

export function useAction<A extends AnyAction>(
  action: A,
  ...args: OptionsArg<A>
) {
  const options = (args[0] ?? {}) as UseActionOptions<A>;
  const [isPending, startTransition] = useTransition();

  function execute(input: ActionInput<A>) {
    startTransition(async () => {
      const id = options.loading ? toast.loading(options.loading) : undefined;

      try {
        const result = (await action(input as never)) as
          | ActionResult<ActionData<A>, ActionCustomError<A>>
          | undefined;

        // the action redirected: navigation is already happening
        if (!result) {
          if (id) toast.dismiss(id);
          return;
        }

        if (result.ok) {
          const message =
            typeof options.success === "function"
              ? options.success(result.data)
              : options.success;

          if (message) toast.success(message, { id });
          else if (id) toast.dismiss(id);

          options.onSuccess?.(result.data);
          return;
        }

        const messages: Record<string, string> = {
          ...baseActionErrors,
          ...options.errors,
        };
        toast.error(messages[result.error] ?? baseActionErrors.server_error, {
          id,
        });

        options.onError?.(result.error as ActionError<A>);
      } catch {
        toast.error(networkError, { id });
      }
    });
  }

  return { execute, isPending };
}
