"use client";
// packages
import { useFormContext, useFormState, useWatch } from "react-hook-form";

// components
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// schema
import { type ProfileFormValues } from "@/schemas/consultant/profile";

// icons
import { Plus, Trash2 } from "lucide-react";

// props
interface Props {
  name: "neducation" | "nexperiences";
  label: string;
  itemPlaceholder: string;
  addLabel: string;
  max: number;
  disabled: boolean;
}

// list of short text lines (1..max)
export function DynamicListField({
  name,
  label,
  itemPlaceholder,
  addLabel,
  max,
  disabled,
}: Props) {
  const { control, setValue } = useFormContext<ProfileFormValues>();
  const { isSubmitted } = useFormState({ control });
  const items = useWatch({ control, name }) ?? [];

  // add empty line
  const add = () => {
    if (items.length >= max) return;
    setValue(name, [...items, ""], { shouldDirty: true });
  };

  // remove line; revalidate after first submit so stale errors don't shift rows
  const remove = (index: number) => {
    if (items.length <= 1) return;
    setValue(
      name,
      items.filter((_, i) => i !== index),
      { shouldDirty: true, shouldValidate: isSubmitted },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-xs tabular-nums text-muted-foreground">
          {items.length}/{max}
        </span>
      </div>

      {items.map((_, index) => (
        <FormField
          key={index}
          control={control}
          name={`${name}.${index}` as const}
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input
                    {...field}
                    maxLength={50}
                    placeholder={`${itemPlaceholder} ${index + 1}`}
                    disabled={disabled}
                  />
                </FormControl>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    disabled={disabled}
                    onClick={() => remove(index)}
                    aria-label={`حذف ${itemPlaceholder} ${index + 1}`}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}

      {items.length < max && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={disabled}
          onClick={add}
        >
          <Plus className="w-4 h-4" />
          {addLabel}
        </Button>
      )}
    </div>
  );
}
