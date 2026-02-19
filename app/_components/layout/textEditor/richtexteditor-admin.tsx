"use client";
// React & Next
import React from "react";

// packages
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import BulletList from "@tiptap/extension-bullet-list";

// components
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// lib
import { cn } from "@/lib/utils";

// constants
import {
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Highlighter,
  List,
  ListOrdered,
} from "lucide-react";

// props
interface SProps {
  children?: React.ReactNode;
  className?: string;
  onClick: () => any;
}

// styling buttons
const SButton: React.FC<SProps> = ({ children, className, onClick }) => (
  <Button
    className={cn([className, "px-2 py-1"])}
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
    <div className="flex flex-wrap items-center gap-2 px-2 py-2">
      {/* Undo / Redo */}
      <SButton onClick={() => editor.chain().focus().undo().run()}>
        Undo
      </SButton>
      <SButton onClick={() => editor.chain().focus().redo().run()}>
        Redo
      </SButton>

      {/* Headings */}
      {[1, 2, 3, 5].map((level) => (
        <SButton
          key={level}
          className={editor.isActive("heading", { level }) ? "is-active" : ""}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({ level: level as any })
              .run()
          }
        >
          H{level}
        </SButton>
      ))}

      {/* Paragraph */}
      <SButton
        className={editor.isActive("paragraph") ? "is-active" : ""}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        P
      </SButton>

      {/* Bold */}
      <SButton
        className={editor.isActive("bold") ? "is-active" : ""}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="w-4" />
      </SButton>

      {/* Highlight */}
      <SButton
        className={editor.isActive("highlight") ? "is-active" : ""}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        <Highlighter className="w-4" />
      </SButton>

      {/* Bullet List */}
      {/* <SButton
        className={editor.isActive("bulletList") ? "is-active" : ""}
        onClick={() => {
          if (editor.isActive("bulletList")) {
            // If already in a list → remove list
            editor.chain().focus().toggleBulletList().run();
          } else {
            const { state } = editor;
            const { from, to } = state.selection;
            const selectedText = state.doc.textBetween(from, to, "\n");

            if (selectedText.trim().length > 0) {
              const lines = selectedText
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter((line) => line.length > 0);
              const listItems = lines
                .map((line) => `<li>${line}</li>`)
                .join("");
              const html = `<ul>${listItems}</ul>`;

              editor.chain().focus().insertContent(html).run();
            } else {
              editor.chain().focus().toggleBulletList().run();
            }
          }
        }}
      >
        <List className="w-4" />
      </SButton> */}

      {/* Ordered List */}
      {/* <SButton
        className={editor.isActive("orderedList") ? "is-active" : ""}
        onClick={() => {
          if (editor.isActive("orderedList")) {
            // If already in a list → remove list
            editor.chain().focus().toggleOrderedList().run();
          } else {
            const { state } = editor;
            const { from, to } = state.selection;
            const selectedText = state.doc.textBetween(from, to, "\n");

            if (selectedText.trim().length > 0) {
              const lines = selectedText
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter((line) => line.length > 0);
              const listItems = lines
                .map((line) => `<li>${line}</li>`)
                .join("");
              const html = `<ol>${listItems}</ol>`;

              editor.chain().focus().insertContent(html).run();
            } else {
              editor.chain().focus().toggleOrderedList().run();
            }
          }
        }}
      >
        <ListOrdered className="w-4" />
      </SButton> */}

      {/* Text Alignment */}
      <SButton
        className={editor.isActive({ textAlign: "left" }) ? "is-active" : ""}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft className="w-4" />
      </SButton>
      <SButton
        className={editor.isActive({ textAlign: "center" }) ? "is-active" : ""}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignJustify className="w-4" />
      </SButton>
      <SButton
        className={editor.isActive({ textAlign: "right" }) ? "is-active" : ""}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight className="w-4" />
      </SButton>
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
const RichEditorAdmin: React.FC<Props> = ({
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
      BulletList,
      OrderedList,
      ListItem,
      TextAlign.configure({
        types: ["heading", "paragraph"],
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
        ["flex flex-col gap-1 max-w-[500px] rounded-lg selection border-2"],
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

export default RichEditorAdmin;
