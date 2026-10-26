import { useState } from "react";
import {
  X,
  UserPlus,
  Edit2,
  Check,
  LogOut,
  Users,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { IconButton } from "@/components/ui/IconButton";
import { ScrollArea } from "@/components/ui/ScrollArea";
import useStore from "@/lib/store";
import { useContacts } from "@/lib/api/chatQueries";
import { useUserId } from "@/lib/hooks";
import { usePresenceStore } from "@/lib/store/presenceStore";
import { chatKeys } from "@/lib/socket/useSocketSync";
import { router } from "@/routes/router";
import type { ChatSummary } from "@chat-me/shared";
import {
  updateGroupMetadata,
  addGroupParticipants,
  updateParticipantRole,
  removeParticipant,
} from "@/lib/api/groupActions";
import { GroupParticipantItem } from "./GroupParticipantItem";

interface GroupInfoDrawerProps {
  chatSummary: ChatSummary;
}

export function GroupInfoDrawer({ chatSummary }: GroupInfoDrawerProps) {
  const queryClient = useQueryClient();
  const closeRightDrawer = useStore((state) => state.closeRightDrawer);
  const currentUserId = useUserId();

  const { data: serverContacts } = useContacts();
  const presenceByUser = usePresenceStore((state) => state.presenceByUser);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState("");
  const [isEditingPicture, setIsEditingPicture] = useState(false);
  const [editedPicture, setEditedPicture] = useState("");
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [selectedNewParticipantId, setSelectedNewParticipantId] = useState("");

  const participants = chatSummary.participants || [];
  const myParticipant = participants.find((p) => p.userId === currentUserId);
  const isAdmin = myParticipant?.role === "admin";
  const groupTitle = chatSummary.title || "Grupo";
  const groupBio = chatSummary.bio || "";
  const groupPicture = chatSummary.pictureUrl || "";

  const availableContactsToAdd = (serverContacts || []).filter(
    (sc) => !participants.some((p) => p.userId === sc.contact.id)
  );

  const handleSaveTitle = async () => {
    if (!editedTitle.trim()) return;
    const ok = await updateGroupMetadata(chatSummary.id, {
      title: editedTitle.trim(),
    });
    if (ok) {
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
      setIsEditingTitle(false);
    }
  };

  const handleSaveBio = async () => {
    const ok = await updateGroupMetadata(chatSummary.id, {
      bio: editedBio.trim() || null,
    });
    if (ok) {
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
      setIsEditingBio(false);
    }
  };

  const handleSavePicture = async () => {
    const ok = await updateGroupMetadata(chatSummary.id, {
      pictureUrl: editedPicture.trim() || null,
    });
    if (ok) {
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
      setIsEditingPicture(false);
    }
  };

  const handleAddParticipant = async () => {
    if (!selectedNewParticipantId) return;
    const ok = await addGroupParticipants(chatSummary.id, [
      selectedNewParticipantId,
    ]);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
      setSelectedNewParticipantId("");
      setShowAddParticipant(false);
    }
  };

  const handleToggleRole = async (targetUserId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "member" : "admin";
    const ok = await updateParticipantRole(chatSummary.id, targetUserId, newRole);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    }
  };

  const handleRemove = async (targetUserId: string) => {
    const ok = await removeParticipant(chatSummary.id, targetUserId);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
      if (targetUserId === currentUserId) {
        closeRightDrawer();
        router.navigate({ to: "/" });
      }
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
        <span className="text-base text-background-12 font-medium">
          Info. del grupo
        </span>
      </header>

      <ScrollArea rootClassName="flex-1 overflow-hidden" type="auto">
        <div className="flex flex-col gap-3">
          {/* Group Header: Picture, Title, Bio & Count */}
          <section className="flex flex-col items-center py-6 shadow bg-background-3">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-background-4 mb-4 flex items-center justify-center">
                {groupPicture ? (
                  <img
                    src={groupPicture}
                    alt={groupTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="w-16 h-16 text-background-9" />
                )}
              </div>
              {isAdmin && (
                <button
                  data-testid="edit-group-picture-button"
                  onClick={() => {
                    setEditedPicture(groupPicture);
                    setIsEditingPicture(!isEditingPicture);
                  }}
                  className="absolute bottom-4 right-0 p-2 bg-primary-9 text-white rounded-full hover:bg-primary-10 transition-colors shadow"
                  title="Cambiar foto del grupo"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {isEditingPicture && (
              <div className="flex items-center gap-2 mb-3 px-6 w-full max-w-xs">
                <input
                  type="text"
                  placeholder="URL de imagen..."
                  value={editedPicture}
                  onChange={(e) => setEditedPicture(e.target.value)}
                  className="flex-1 bg-background-1 text-background-12 text-sm border border-background-7 rounded px-2 py-1"
                />
                <button
                  onClick={handleSavePicture}
                  className="p-1 bg-primary-9 text-white rounded hover:bg-primary-10"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex flex-col items-center gap-1 px-6 text-center w-full">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 w-full max-w-xs">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="flex-1 bg-background-1 text-background-12 text-base font-medium border border-background-7 rounded px-2 py-1"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-1 bg-primary-9 text-white rounded hover:bg-primary-10"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xl font-medium text-background-12">
                    {groupTitle}
                  </span>
                  {isAdmin && (
                    <button
                      data-testid="edit-group-title-button"
                      onClick={() => {
                        setEditedTitle(groupTitle);
                        setIsEditingTitle(true);
                      }}
                      className="text-background-11 hover:text-primary-9"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Group Bio */}
              {isEditingBio ? (
                <div className="flex items-center gap-2 w-full max-w-xs mt-1">
                  <input
                    type="text"
                    value={editedBio}
                    placeholder="Descripción del grupo..."
                    onChange={(e) => setEditedBio(e.target.value)}
                    className="flex-1 bg-background-1 text-background-12 text-xs border border-background-7 rounded px-2 py-1"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveBio}
                    className="p-1 bg-primary-9 text-white rounded hover:bg-primary-10"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <span
                    data-testid="group-bio-text"
                    className="text-xs text-background-11 italic"
                  >
                    {groupBio || (isAdmin ? "Añadir descripción..." : "")}
                  </span>
                  {isAdmin && (
                    <button
                      data-testid="edit-group-bio-button"
                      onClick={() => {
                        setEditedBio(groupBio);
                        setIsEditingBio(true);
                      }}
                      className="text-background-11 hover:text-primary-9"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              <div className="text-sm text-background-11 mt-1">
                {participants.length}{" "}
                {participants.length === 1 ? "participante" : "participantes"}
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
              {participants.map((p) => (
                <GroupParticipantItem
                  key={p.userId}
                  participant={p}
                  isSelf={p.userId === currentUserId}
                  isAdmin={isAdmin}
                  isOnline={presenceByUser[p.userId]?.status === "online"}
                  onToggleRole={handleToggleRole}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </section>

          {/* Leave Group section */}
          <section className="shadow bg-background-3">
            <div
              data-testid="leave-group-button"
              onClick={() => handleRemove(currentUserId)}
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
