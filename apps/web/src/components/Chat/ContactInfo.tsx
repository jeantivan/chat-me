import { ReactNode, useState } from "react";
import {
  Archive,
  BarChart,
  Bell,
  ChevronRight,
  CircleSlash,
  LucideIcon,
  Star,
  Trash2,
  X,
  Users,
  UserPlus,
  UserMinus,
  ShieldCheck,
  ShieldAlert,
  Edit2,
  Check,
  LogOut,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { IconButton } from "@/components/ui/IconButton";
import { Switch } from "@/components/ui/Switch";
import { Icon } from "@/components/ui/Icon";
import { ScrollArea } from "@/components/ui/ScrollArea";
import useStore from "@/lib/store";
import mc from "@/lib/utils/mergeClassnames";
import { useChats, useContacts } from "@/lib/api/chatQueries";
import { useUserId, useCurrentChatId } from "@/lib/hooks";
import { usePresenceStore } from "@/lib/store/presenceStore";
import { getAuthHeaders } from "@/lib/auth/authClient";
import { chatKeys } from "@/lib/socket/useSocketSync";
import { router } from "@/routes/router";

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
        danger && "text-red-500"
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
  const queryClient = useQueryClient();
  const closeRightDrawer = useStore((state) => state.closeRightDrawer);
  const rightDrawerGoTo = useStore((state) => state.rightDrawerGoTo);
  const muteChat = useStore((state) => state.muteChat);
  const { currentChatId: activeChatId } = useCurrentChatId();
  const currentChatId = chatId || activeChatId;
  const currentUserId = useUserId();

  const { data: chatList } = useChats();
  const { data: serverContacts } = useContacts();
  const chatSummary = chatList?.find((c) => c.id === currentChatId);

  const presenceByUser = usePresenceStore((state) => state.presenceByUser);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isEditingPicture, setIsEditingPicture] = useState(false);
  const [editedPicture, setEditedPicture] = useState("");
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [selectedNewParticipantId, setSelectedNewParticipantId] = useState("");

  const isGroup = chatSummary?.type === "group";

  if (!chatSummary) return null;

  // --- Group Chat View ---
  if (isGroup) {
    const participants = chatSummary.participants || [];
    const myParticipant = participants.find((p) => p.userId === currentUserId);
    const isAdmin = myParticipant?.role === "admin";
    const groupTitle = chatSummary.title || "Grupo";
    const groupPicture = chatSummary.pictureUrl || "";

    const availableContactsToAdd = (serverContacts || []).filter(
      (sc) => !participants.some((p) => p.userId === sc.contact.id)
    );

    const handleSaveTitle = async () => {
      if (!editedTitle.trim()) return;
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || "";
        const res = await fetch(`${apiBase}/api/v1/chats/${chatSummary.id}`, {
          method: "PATCH",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ title: editedTitle.trim() }),
        });
        if (res.ok) {
          queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
          setIsEditingTitle(false);
        }
      } catch {
        // Handle error
      }
    };

    const handleSavePicture = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || "";
        const res = await fetch(`${apiBase}/api/v1/chats/${chatSummary.id}`, {
          method: "PATCH",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ pictureUrl: editedPicture.trim() || null }),
        });
        if (res.ok) {
          queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
          setIsEditingPicture(false);
        }
      } catch {
        // Handle error
      }
    };

    const handleAddParticipant = async () => {
      if (!selectedNewParticipantId) return;
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || "";
        const res = await fetch(
          `${apiBase}/api/v1/chats/${chatSummary.id}/participants`,
          {
            method: "POST",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ userIds: [selectedNewParticipantId] }),
          }
        );
        if (res.ok) {
          queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
          setSelectedNewParticipantId("");
          setShowAddParticipant(false);
        }
      } catch {
        // Handle error
      }
    };

    const handleToggleRole = async (targetUserId: string, currentRole: string) => {
      const newRole = currentRole === "admin" ? "member" : "admin";
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || "";
        const res = await fetch(
          `${apiBase}/api/v1/chats/${chatSummary.id}/participants/${targetUserId}/role`,
          {
            method: "PATCH",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ role: newRole }),
          }
        );
        if (res.ok) {
          queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
        }
      } catch {
        // Handle error
      }
    };

    const handleRemoveParticipant = async (targetUserId: string) => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || "";
        const res = await fetch(
          `${apiBase}/api/v1/chats/${chatSummary.id}/participants/${targetUserId}`,
          {
            method: "DELETE",
            headers: {
              ...getAuthHeaders(),
            },
            credentials: "include",
          }
        );
        if (res.ok) {
          queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
          if (targetUserId === currentUserId) {
            closeRightDrawer();
            router.navigate({ to: "/" });
          }
        }
      } catch {
        // Handle error
      }
    };

    return (
      <div className="bg-background-5 flex flex-col h-screen">
        <header className="min-h-[56px] py-2 px-4 flex items-center sticky gap-4 bg-background-2">
          <IconButton
            label="Cerrar info. del grupo"
            icon={X}
            onClick={closeRightDrawer}
          />
          <h2 className="text-lg line-clamp-1 truncate text-background-12">
            Info. del Grupo
          </h2>
        </header>

        <ScrollArea type="auto">
          <div className="grid gap-4 h-full mb-10">
            {/* Group Header info */}
            <section className="py-4 shadow bg-background-3">
              <div className="flex flex-col px-5">
                <div className="mx-auto mt-8 mb-4">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden bg-primary-3 flex items-center justify-center text-primary-9">
                    {groupPicture ? (
                      <img
                        className="w-full h-full object-cover"
                        src={groupPicture}
                        alt={`Foto de perfil de ${groupTitle}`}
                      />
                    ) : (
                      <Users className="w-16 h-16" />
                    )}
                  </div>
                  {isAdmin && (
                    <div className="mt-2 text-center">
                      {isEditingPicture ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="URL de avatar..."
                            value={editedPicture}
                            onChange={(e) => setEditedPicture(e.target.value)}
                            className="text-xs bg-background-1 border border-background-7 rounded px-2 py-1 w-36"
                          />
                          <button
                            onClick={handleSavePicture}
                            className="text-xs bg-primary-9 text-white px-2 py-1 rounded"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => setIsEditingPicture(false)}
                            className="text-xs text-background-11 px-1 py-1"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditedPicture(groupPicture);
                            setIsEditingPicture(true);
                          }}
                          className="text-xs text-primary-9 hover:underline"
                        >
                          Cambiar foto
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mx-auto text-center w-full max-w-sm">
                  {isEditingTitle ? (
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="flex-1 bg-background-1 text-background-12 border border-background-7 rounded px-3 py-1.5 text-lg"
                      />
                      <IconButton
                        icon={Check}
                        label="Guardar"
                        onClick={handleSaveTitle}
                      />
                      <IconButton
                        icon={X}
                        label="Cancelar"
                        onClick={() => setIsEditingTitle(false)}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <h2 className="text-2xl font-bold text-background-12 truncate">
                        {groupTitle}
                      </h2>
                      {isAdmin && (
                        <IconButton
                          icon={Edit2}
                          label="Editar título"
                          className="w-8 h-8"
                          onClick={() => {
                            setEditedTitle(groupTitle);
                            setIsEditingTitle(true);
                          }}
                        />
                      )}
                    </div>
                  )}

                  <div className="text-sm text-background-11">
                    {participants.length} {participants.length === 1 ? "participante" : "participantes"}
                  </div>
                </div>
              </div>
            </section>

            {/* Participants Section */}
            <section className="py-4 shadow bg-background-3">
              <div className="flex items-center justify-between px-5 mb-3">
                <div className="text-sm font-medium text-primary-9">
                  {participants.length} Participantes
                </div>
                {isAdmin && (
                  <button
                    data-testid="add-participant-button"
                    onClick={() => setShowAddParticipant(!showAddParticipant)}
                    className="inline-flex items-center gap-1 text-sm text-primary-9 hover:underline"
                  >
                    <UserPlus className="w-4 h-4" />
                    Añadir participante
                  </button>
                )}
              </div>

              {/* Add participant selector */}
              {showAddParticipant && (
                <div className="px-5 py-3 bg-background-2 border-y border-background-7 mb-3 flex items-center gap-2">
                  <select
                    value={selectedNewParticipantId}
                    onChange={(e) => setSelectedNewParticipantId(e.target.value)}
                    className="flex-1 bg-background-1 text-background-12 text-sm border border-background-7 rounded px-2 py-1.5"
                  >
                    <option value="">Selecciona un contacto...</option>
                    {availableContactsToAdd.map((sc) => (
                      <option key={sc.contact.id} value={sc.contact.id}>
                        {sc.nickname || sc.contact.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddParticipant}
                    disabled={!selectedNewParticipantId}
                    className="px-3 py-1.5 bg-primary-9 text-white text-xs font-medium rounded hover:bg-primary-10 disabled:opacity-50"
                  >
                    Añadir
                  </button>
                </div>
              )}

              {/* Participant list */}
              <div className="divide-y divide-background-7/50">
                {participants.map((p) => {
                  const presence = presenceByUser[p.userId];
                  const isUserOnline = presence?.status === "online";
                  const isSelf = p.userId === currentUserId;

                  return (
                    <div
                      key={p.userId}
                      className="flex items-center justify-between px-5 py-3 hover:bg-background-4 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-background-4 shrink-0">
                          <img
                            src={p.user?.pictureUrl || ""}
                            alt={p.user?.name}
                            className="w-full h-full object-cover"
                          />
                          {isUserOnline && (
                            <span
                              data-testid="participant-online-dot"
                              className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-background-1"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-background-12 truncate flex items-center gap-2">
                            <span>{p.user?.name}</span>
                            {isSelf && (
                              <span className="text-xs text-background-11">(Tú)</span>
                            )}
                          </div>
                          <div className="text-xs text-background-11 truncate">
                            {isUserOnline ? "En línea" : "Desconectado"}
                            {p.user?.bio ? ` • ${p.user.bio}` : ""}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {p.role === "admin" ? (
                          <span
                            data-testid="admin-badge"
                            className="text-xs px-2 py-0.5 rounded bg-primary-3 text-primary-9 font-medium"
                          >
                            Admin
                          </span>
                        ) : (
                          <span
                            data-testid="member-badge"
                            className="text-xs px-2 py-0.5 rounded bg-background-6 text-background-11 font-medium"
                          >
                            Miembro
                          </span>
                        )}

                        {isAdmin && !isSelf && (
                          <div className="flex items-center gap-1">
                            <button
                              title={p.role === "admin" ? "Degradar a miembro" : "Promover a admin"}
                              onClick={() => handleToggleRole(p.userId, p.role)}
                              className="p-1 rounded text-background-11 hover:text-primary-9 hover:bg-background-6/20"
                            >
                              {p.role === "admin" ? (
                                <ShieldAlert className="w-4 h-4" />
                              ) : (
                                <ShieldCheck className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              title="Eliminar del grupo"
                              onClick={() => handleRemoveParticipant(p.userId)}
                              className="p-1 rounded text-background-11 hover:text-red-500 hover:bg-background-6/20"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Leave Group section */}
            <section className="shadow bg-background-3">
              <div
                data-testid="leave-group-button"
                onClick={() => handleRemoveParticipant(currentUserId)}
                className="flex items-center gap-4 py-4 px-6 text-red-500 hover:bg-background-4 cursor-pointer transition-colors"
              >
                <LogOut className="w-6 h-6" />
                <span className="text-base font-medium">Salir del grupo</span>
              </div>
            </section>
          </div>
        </ScrollArea>
      </div>
    );
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
                <div className="w-40 h-40 rounded-full text-gray-500">
                  <img
                    className="bg-gray-400 w-full h-full rounded-full"
                    src={picture}
                    alt={`Foto de perfil de ${name}`}
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

          <section className="py-4 shadow bg-background-3">
            <div className="flex px-5 mb-4">
              <div className="flex-1 text-sm text-primary-9">
                Archivos, enlaces y documentos.
              </div>
              <button
                onClick={() => {
                  rightDrawerGoTo("SHARED_CONTENT");
                }}
                className="inline-flex items-center text-background-11 text-sm"
              >
                20
                <Icon icon={ChevronRight} label="Ver más" />
              </button>
            </div>
            <div className="px-5 flex flex-row w-full mb-4">
              <div className="w-1/3 aspect-square rounded-md bg-gray-300 mx-2" />
              <div className="w-1/3 aspect-square rounded-md bg-gray-300 mx-2" />
              <div className="w-1/3 aspect-square rounded-md bg-gray-300 mx-2" />
            </div>
            <div className={`text-sm text-background-12 px-5`}>
              Usa WhatsApp en tu teléfono para ver el historial de mensajes
              completo.
            </div>
          </section>

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
                    muteChat(id);
                  }}
                />
              }
            >
              Silenciar Notificaciones
            </Item>
            <Item
              icon={BarChart}
              textHelper={`Ve estadísticas relevantes de este chat 
              como: cantidad de mensajes enviados, almacenamiento de archivos, etc.`}
            >
              Estadísticas
            </Item>
          </section>
          <section className="shadow bg-background-3">
            <Item icon={Archive} danger>
              Archivar chat
            </Item>
            <Item icon={Trash2} danger>
              Eliminar chat
            </Item>
            <Item icon={CircleSlash} danger>
              Bloquear a {name}
            </Item>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
