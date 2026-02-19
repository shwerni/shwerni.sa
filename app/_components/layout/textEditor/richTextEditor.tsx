"use client";
// React & Next
import React from "react";

// packages
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

// components
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// lib
import { cn } from "@/lib/utils";

// constants
import {
  AArrowDown,
  AArrowUp,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Highlighter,
} from "lucide-react";

// props
interface SProps {
  children?: React.ReactNode;
  className: string;
  onClick: () => any;
}

// styling buttons
const SButton: React.FC<SProps> = ({ children, className, onClick }) => (
  <Button
    className={cn([className, "bg-gray-200 dark:bg-slate-600 px-2 py-1"])}
    type="button"
    onClick={onClick}
    variant="ghost"
  >
    {children}
  </Button>
);

// styling menu bar
const MenuBar: React.FC<{ editor: Editor | null }> = ({ editor }) => {
  if (!editor) return null;

  return (
    <div>
      <div className="flex flex-row justify-start items-center gap-1 sm:gap-3 w-full my-2 mx-1 sm:mx-2">
        <SButton
          className={editor.isActive("paragraph") ? "is-active" : ""}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          <AArrowUp className="w-5" />
        </SButton>

        <SButton
          className={
            editor.isActive("heading", { level: 6 }) ? "is-active" : ""
          }
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 6 }).run()
          }
        >
          <AArrowDown className="w-5" />
        </SButton>

        <SButton
          className={editor.isActive("bold") ? "is-active" : ""}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="w-5" />
        </SButton>

        <SButton
          className={editor.isActive("highlight") ? "is-active" : ""}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          <Highlighter className="w-5" />
        </SButton>
        {/* 
        <SButton
          className={cn(editor.isActive("text-right") && "is-active")}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="w-5" />
        </SButton>
        <SButton
          className={cn(editor.isActive("text-center") && "is-active")}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignJustify className="w-5" />
        </SButton>
        <SButton
          className={cn(editor.isActive("text-left") && "is-active")}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="w-5" />
        </SButton> */}
      </div>
    </div>
  );
};

// props
interface Props {
  content: string;
  disabled?: boolean;
  placeholder?: string;
  onChange: (content: string) => void;
}

// rich editor textarea
const RichEditor: React.FC<Props> = ({
  disabled,
  content,
  placeholder,
  onChange,
}) => {
  // state
  const [htmlContent, setHtmlContent] = React.useState(content);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      Highlight,
    ],
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setHtmlContent(html);
      onChange(html);
    },
    content,
    editorProps: {
      attributes: {
        class:
          "min-h-[150px] cursor-text rounded-lg p-5 ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ",
        style: "text-align: inherit;",
      },
    },
    immediatelyRender: false,
  });

  return (
    <div
      className={cn(
        ["flex flex-col gap-1 max-w-[500px] bg-bg- rounded-lg selection border-2"],
        disabled ? "pointer-events-none opacity-55" : ""
      )}
    >
      <MenuBar editor={editor} />
      <Separator className="w-11/12 mx-auto" />
      <EditorContent
        editor={editor}
        placeholder={placeholder || ""}
        dir="rtl"
      />
      {/* hidden input to send data with the form */}
      <input type="hidden" name="article" value={htmlContent} />
    </div>
  );
};

export default RichEditor;
