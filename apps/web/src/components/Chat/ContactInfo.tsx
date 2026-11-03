import { ReactNode, useState } from "react";
import {
  Archive,
  Bell,
  ChevronRight,
  CircleSlash,
  Eraser,
  LucideIcon,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { IconButton } from "@/components/ui/IconButton";
import { Switch } from "@/components/ui/Switch";
import { ScrollArea } from "@/components/ui/ScrollArea";
import useStore from "@/lib/store";
import mc from "@/lib/utils/mergeClassnames";
import { useChats, useUpdateChatParticipant } from "@/lib/api/chatQueries";
import {
  useBlockedUsers,
  useBlockUser,
  useUnblockUser,
} from "@/lib/api/settingsQueries";
import { useUserId, useCurrentChatId } from "@/lib/hooks";
import { UserImage } from "@/components/UserImage";
import { GroupInfoDrawer } from "./GroupInfoDrawer";
import { ClearChatDialog } from "./ClearChatDialog";
import { DeleteChatDialog } from "./DeleteChatDialog";
import { SharedMediaPreview } from "./SharedMediaPreview";

type ItemProps = {
  children: ReactNode;
  danger?: boolean;
  icon?: LucideIcon;
  textHelper?: string;
  action?: JSX.Element;
} & React.HTMLAttributes<HTMLDivElement>;

const Item = ({
  children,
  danger,
  textHelper,
  icon,
  action,
  ...rest
}: ItemProps) => {
  const Icon = icon || "svg";
  return (
    <div
      {...rest}
      className={mc(
        "flex gap-6 py-4 px-6 text-background-11 text-lg ",
        rest.onClick && "cursor-pointer hover:bg-background-4 select-none",
        danger && "text-red-500",
        rest.className
      )}
    >
      {icon && <Icon className="w-6 h-6" />}
      <div
        className={mc(
          "flex-1",
          "text-background-12",
          danger && "text-inherit dark:text-inherit"
        )}
      >
        {children}

        {textHelper && (
          <div className="mt-1.5 text-sm text-background-11">{textHelper}</div>
        )}
      </div>
      {action}
    </div>
  );
};

export function ContactInfo({ chatId }: { chatId?: string } = {}) {
  const closeRightDrawer = useStore((state) => state.closeRightDrawer);
  const rightDrawerGoTo = useStore((state) => state.rightDrawerGoTo);
  const updateParticipant = useUpdateChatParticipant();
  const { currentChatId: activeChatId } = useCurrentChatId();
  const currentChatId = chatId || activeChatId;
  const currentUserId = useUserId();

  const { data: chatList } = useChats();
  const chatSummary = chatList?.find((c) => c.id === currentChatId);

  const { data: blockedUsers = [] } = useBlockedUsers();
  const { mutate: blockUser, isPending: isBlocking } = useBlockUser();
  const { mutate: unblockUser, isPending: isUnblocking } = useUnblockUser();
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  if (!chatSummary) return null;

  // --- Group Chat View ---
  if (chatSummary.type === "group") {
    return <GroupInfoDrawer chatSummary={chatSummary} />;
  }

  // --- Direct Chat View ---
  const chat = {
    id: chatSummary.id,
    muted:
      chatSummary.participants.find((p) => p.userId === currentUserId)?.muted ||
      false,
    participants:
      chatSummary.participants
        .filter((p) => p.userId !== currentUserId)
        .map((p) => ({
          id: p.user?.id || p.userId,
          name: p.user?.name || "Chat",
          phone: p.user?.phone || "",
          bio: p.user?.bio || "",
          picture: p.user?.pictureUrl || "",
        })) || [],
  };

  const {
    id,
    muted,
    participants: [contact],
  } = chat;
  const { name, phone, bio, picture } = contact || {
    name: "Chat",
    phone: "",
    bio: "",
    picture: "",
  };

  const targetUserId = contact?.id;
  const isBlocked = Boolean(
    targetUserId && blockedUsers.some((b) => b.id === targetUserId)
  );

  const handleToggleBlock = () => {
    if (!targetUserId || isBlocking || isUnblocking) return;
    if (isBlocked) {
      unblockUser(targetUserId);
    } else {
      blockUser(targetUserId);
    }
  };

  return (
    <div className="bg-background-5 flex flex-col h-screen">
      <header className="min-h-[56px] py-2 px-4 flex items-center sticky gap-4 bg-background-2">
        <IconButton
          label="Cerrar info. del contacto"
          icon={X}
          onClick={() => {
            closeRightDrawer();
          }}
        />
        <h2
          id="contact-info-title "
          className="text-lg line-clamp-1 truncate text-background-12"
        >
          Info. del Contacto
        </h2>
      </header>
      <ScrollArea type="auto">
        <div className="grid gap-4 h-full mb-10">
          <section className="py-4 shadow bg-background-3">
            <div className="flex flex-col px-5">
              <div className="mx-auto mt-16 mb-4">
                <div className="w-40 h-40 rounded-full">
                  <UserImage
                    src={isBlocked ? "" : picture}
                    alt={`Foto de perfil de ${name}`}
                    className="w-full h-full"
                  />
                </div>
              </div>
              <div className="mx-auto text-center">
                <h2 className="text-2xl mb-2 text-background-12">{name}</h2>
                <div className="text-background-11">{phone}</div>
              </div>
            </div>
          </section>
          <section className="py-4 shadow bg-background-3">
            <div className="px-5">
              <div className="text-sm text-primary-9">Info.</div>
              <div className={`text-lg text-background-12`}>{bio}</div>
            </div>
          </section>

          <SharedMediaPreview chatId={currentChatId} testIdPrefix="contact" />

          <section className="py-4 shadow bg-background-3">
            <Item
              onClick={() => {
                rightDrawerGoTo("STARRED_MESSAGES");
              }}
              icon={Star}
              action={<ChevronRight className="w-6 h-6" />}
            >
              Mensajes destacados
            </Item>
            <Item
              icon={Bell}
              action={
                <Switch
                  checked={muted}
                  onCheckedChange={() => {
                    updateParticipant.mutate({ chatId: id, muted: !muted });
                  }}
                />
              }
            >
              Silenciar Notificaciones
            </Item>
          </section>
          <section className="shadow bg-background-3">
            <Item
              icon={Archive}
              danger
              onClick={() => {
                const isArchived =
                  chatSummary.participants.find((p) => p.userId === currentUserId)
                    ?.archived || false;
                updateParticipant.mutate({
                  chatId: id,
                  archived: !isArchived,
                });
              }}
            >
              {chatSummary.participants.find((p) => p.userId === currentUserId)
                ?.archived
                ? "Desarchivar chat"
                : "Archivar chat"}
            </Item>
            <Item
              icon={Eraser}
              danger
              onClick={() => setIsClearOpen(true)}
            >
              Vaciar chat
            </Item>
            <Item
              icon={Trash2}
              danger
              onClick={() => setIsDeleteOpen(true)}
            >
              Eliminar chat
            </Item>
            <Item
              icon={CircleSlash}
              danger={!isBlocked}
              data-testid="block-unblock-contact-action"
              role="button"
              tabIndex={0}
              aria-label={isBlocked ? `Desbloquear a ${name}` : `Bloquear a ${name}`}
              onClick={handleToggleBlock}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleToggleBlock();
                }
              }}
            >
              {isBlocked ? `Desbloquear a ${name}` : `Bloquear a ${name}`}
            </Item>
          </section>
        </div>
      </ScrollArea>
      <ClearChatDialog
        chatId={id}
        open={isClearOpen}
        onOpenChange={setIsClearOpen}
      />
      <DeleteChatDialog
        chatId={id}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </div>
  );
}
