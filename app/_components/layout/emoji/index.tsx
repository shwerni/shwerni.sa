"use client";

import * as React from "react";
import { Control, Controller } from "react-hook-form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";
import {
  EmojiPicker,
  EmojiPickerSearch,
  EmojiPickerContent,
  EmojiPickerFooter,
} from "@/app/_components/layout/shadcnM/emojipicker";

interface EmojiInputProps {
  control: Control<any>;
  name: string;
  className?: string;
  onInsertEmoji?: (emoji: string) => void;
}

export function EmojiInput({
  control,
  name,
  className,
  onInsertEmoji,
}: EmojiInputProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => (
        <div className={`flex items-center ${className || ""}`}>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" type="button">
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[320px]" align="end">
              <EmojiPicker
                className="h-[312px]"
                onEmojiSelect={({ emoji }) => {
                  if (onInsertEmoji) {
                    // Use parent's handler to insert emoji (e.g. at cursor)
                    onInsertEmoji(emoji);
                  } else {
                    // Default: append emoji to the end of current value
                    onChange((value ?? "") + emoji);
                  }
                }}
              >
                <EmojiPickerSearch />
                <EmojiPickerContent />
                <EmojiPickerFooter />
              </EmojiPicker>
            </PopoverContent>
          </Popover>
        </div>
      )}
    />
  );
}
