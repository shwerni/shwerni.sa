"use client";
// React & Next
import React from "react";

// pacakges
import { z } from "zod";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// components
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmojiInput } from "@/app/_components/layout/emoji";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// utils
import { cn } from "@/lib/utils";
import { dateToTime } from "@/utils/moment";

// prisma data
import { getWhatsappChat } from "@/data/whatsapp";

// hooks
import { useIsMobile } from "@/hooks/use-mobile";

// lib
import { sendWhatsappChat } from "@/lib/api/whatsapp/chat";

// icons
import {
  Send,
  MoreVertical,
  Search,
  ChevronLeft,
  Check,
  Paperclip,
  ScrollText,
} from "lucide-react";
import { timeZone } from "@/lib/site/time";

// types
type Contact = {
  waid: string;
  name: string;
  phone: string;
  time?: string;
  lastMessage?: string;
  unread?: number;
};

type Message = {
  time: Date;
  from: string;
  content: string;
};

// zod schema
const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
});

// type form
type MessageForm = z.infer<typeof messageSchema>;

// props
interface Props {
  contacts: Contact[];
}

export function ChatInterface({ contacts }: Props) {
  // hooks
  const isMobile = useIsMobile();

  // states
  // selected current contact
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(
    null,
  );

  // show chat
  const [showChat, setShowChat] = React.useState(false);

  // chats message content
  const [chatMessages, setChatMessages] = React.useState<Message[]>([]);

  // transistion
  const [isPending, startTransition] = React.useTransition();

  // form
  const form = useForm<MessageForm>({
    resolver: zodResolver(messageSchema),
    defaultValues: { content: "" },
  });

  const onSubmit = (data: MessageForm) => {
    // date
    const { iso: originDate } = timeZone();

    // new message
    const newMessage: Message = {
      from: "966553689116",
      content: data.content,
      time: originDate,
    };

    startTransition(() => {
      // validate
      if (selectedContact) {
        // set message
        setChatMessages((prev) => [...prev, newMessage]);
        // send & store
        sendWhatsappChat(
          "966553689116",
          selectedContact?.waid,
          selectedContact?.phone,
          selectedContact?.name,
          newMessage.content,
        );
        form.reset();
      }
    });
  };

  const handleContactSelect = async (contact: Contact) => {
    // update selected contact
    setSelectedContact(contact);
    setChatMessages([]);
    if (isMobile) setShowChat(true);

    startTransition(async () => {
      const messages = await getWhatsappChat(contact.waid);

      setChatMessages(messages || []);
    });
  };

  const handleBackToContacts = () => {
    setShowChat(false);
  };

  // Helper for message bubble styles
  const getMessageClasses = (message: Message) => {
    const isFromContact = message.from === selectedContact?.phone;
    return cn(
      "flex flex-col gap-2 rounded-lg w-fit max-w-[70%] px-3 pt-2 pb-1",
      isFromContact
        ? "bg-slate-100 text-black"
        : "ml-auto bg-slate-800 text-white",
    );
  };

  return (
    <div className="flex h-[600px] w-full max-w-4xl overflow-hidden rounded-lg border bg-background shadow-lg">
      {/* Contacts sidebar */}
      {(!isMobile || (isMobile && !showChat)) && (
        <div className="flex w-full flex-col border-r md:w-1/3">
          <SidebarHeader />
          <SearchInput />
          <ContactsList
            contacts={contacts}
            selectedContact={selectedContact}
            onSelect={handleContactSelect}
          />
        </div>
      )}

      {/* Chat area */}
      {(!isMobile || (isMobile && showChat)) && (
        <div className="flex w-full flex-col md:w-2/3">
          <ChatHeader
            contact={selectedContact}
            isMobile={isMobile}
            onBack={handleBackToContacts}
          />
          <MessagesArea
            messages={chatMessages}
            isLoading={isPending && chatMessages.length === 0}
            selectedContact={selectedContact}
            getMessageClasses={getMessageClasses}
          />
          <MessageInput
            form={form}
            onSubmit={onSubmit}
            disabled={!selectedContact}
            isPending={isPending}
          />
        </div>
      )}
    </div>
  );
}

function SidebarHeader() {
  return (
    <div className="flex h-16 items-center justify-between border-b px-4">
      <Avatar>
        <AvatarFallback>Za</AvatarFallback>
      </Avatar>
      <Button variant="ghost" size="icon">
        <MoreVertical className="h-5 w-5" />
      </Button>
    </div>
  );
}

function SearchInput() {
  return (
    <div className="border-b p-2">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search or start new chat" className="pl-8" />
      </div>
    </div>
  );
}

interface ContactsListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelect: (contact: Contact) => void;
}

function ContactsList({
  contacts,
  selectedContact,
  onSelect,
}: ContactsListProps) {
  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col">
        {contacts
          .sort((a, b) => contacts.indexOf(b) - contacts.indexOf(a))
          .map((contact) => (
            <button
              key={contact.waid}
              className={cn(
                "flex items-center gap-3 border-b p-3 text-left hover:bg-muted/50",
                selectedContact?.waid === contact.waid && "bg-muted",
              )}
              onClick={() => onSelect(contact)}
            >
              <Avatar>
                <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{contact.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {contact.time}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm text-muted-foreground">
                    {contact.lastMessage}
                  </p>
                  {contact.unread ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs text-white">
                      {contact.unread}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          ))}
      </div>
    </ScrollArea>
  );
}

interface ChatHeaderProps {
  contact: Contact | null;
  isMobile: boolean;
  onBack: () => void;
}

function ChatHeader({ contact, isMobile, onBack }: ChatHeaderProps) {
  return (
    <div className="flex h-16 items-center justify-between border-b px-4">
      <div className="flex items-center gap-3">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <Avatar>
          <AvatarFallback>{contact?.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium">{contact?.name || "No Contact"}</h3>
          {contact && (
            <p className="text-xs text-muted-foreground">{contact?.phone}</p>
          )}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>copy</DropdownMenuLabel>
          {/* copy client phone */}
          {contact?.name && (
            <DropdownMenuItem
              onClick={() => {
                toast.success("copied!");
                navigator.clipboard.writeText(contact?.name);
              }}
            >
              name
            </DropdownMenuItem>
          )}
          {/* separator */}
          <DropdownMenuSeparator />
          {/* copy phone */}
          {contact?.phone && (
            <DropdownMenuItem
              onClick={() => {
                toast.success("copied!");
                navigator.clipboard.writeText(String(contact?.phone));
              }}
            >
              phone number
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface MessagesAreaProps {
  messages: Message[];
  isLoading: boolean;
  selectedContact: Contact | null;
  getMessageClasses: (message: Message) => string;
}

function MessagesArea({
  messages,
  isLoading,
  selectedContact,
  getMessageClasses,
}: MessagesAreaProps) {
  if (isLoading) {
    return (
      <ScrollArea className="flex-1 bg-muted/20 p-4">
        <div className="my-10 mx-auto">
          <p className="text-center text-muted-foreground py-5">
            Loading messages...
          </p>
        </div>
      </ScrollArea>
    );
  }

  // grouped message
  const groupedMessages = messages.reduce(
    (acc, message) => {
      const dateKey = message.time.toDateString();

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(message);
      return acc;
    },
    {} as Record<string, Message[]>,
  );

  return (
    <ScrollArea className="flex-1 bg-muted/20 p-4">
      <div className="flex flex-col gap-2">
        {Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
          <React.Fragment key={dateKey}>
            {/* Date separator */}
            <div className="relative flex items-center justify-center my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t"></span>
              </div>
              <div className="relative bg-background px-2 text-xs text-muted-foreground">
                {format(new Date(dateKey), "EEEE MMMM | dd-MM-yyyy")}
              </div>
            </div>
            {dayMessages.map((message, i) => {
              const isFromContact = message.from === selectedContact?.phone;
              return (
                <div key={i} className={getMessageClasses(message)}>
                  <p
                    dir="rtl"
                    className={cn(
                      isFromContact
                        ? "bg-slate-100 text-black"
                        : "bg-slate-800 text-white",
                    )}
                    onClick={() => {
                      toast.success("copied!");
                      navigator.clipboard.writeText(String(message.content));
                    }}
                  >
                    {message.content}
                  </p>
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs",
                      message.from === "0" && "ml-auto",
                    )}
                  >
                    <span>{dateToTime(message.time)}</span>
                    {message.from === "0" && (
                      <Check className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </ScrollArea>
  );
}

interface MessageInputProps {
  form: ReturnType<typeof useForm<MessageForm>>;
  onSubmit: (data: MessageForm) => void;
  disabled: boolean;
  isPending: boolean;
}

function MessageInput({
  form,
  onSubmit,
  disabled,
  isPending,
}: MessageInputProps) {
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex items-center gap-2 border-t p-3"
    >
      <EmojiInput
        control={form.control}
        name="content"
        onInsertEmoji={(emoji) =>
          form.setValue("content", form.getValues("content") + ` ${emoji}`)
        }
      />
      <Button variant="ghost" size="icon" disabled={disabled}>
        <Paperclip className="h-5 w-5" />
      </Button>
      <Input
        placeholder="Type a message"
        {...form.register("content")}
        className="flex-1"
        disabled={disabled}
      />
      <Button
        variant="ghost"
        size="icon"
        type="submit"
        disabled={!form.formState.isValid || isPending || disabled}
      >
        {form.formState.isValid ? (
          <Send className="h-5 w-5" />
        ) : (
          <ScrollText className="h-5 w-5" /> // later templates pop up
        )}
      </Button>
    </form>
  );
}
