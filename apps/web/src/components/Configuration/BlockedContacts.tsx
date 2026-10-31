import React, { useState } from "react";
import { UserPlus, X, UserX } from "lucide-react";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useContacts } from "@/lib/api/chatQueries";
import {
  useBlockedUsers,
  useBlockUser,
  useUnblockUser,
} from "@/lib/api/settingsQueries";

export function BlockedContacts() {
  const { data: blockedUsers = [] } = useBlockedUsers();
  const { data: contacts = [] } = useContacts();
  const { mutate: blockUser, isPending: isBlocking } = useBlockUser();
  const { mutate: unblockUser, isPending: isUnblocking } = useUnblockUser();

  const [isAddingBlock, setIsAddingBlock] = useState(false);

  // Set of already blocked user IDs
  const blockedIds = new Set(blockedUsers.map((b) => b.id));

  // Contacts that are not yet blocked
  const availableToBlock = contacts.filter(
    (c) => !blockedIds.has(c.contactUserId) && !blockedIds.has(c.contact?.id)
  );

  return (
    <ScrollArea type="auto" className="h-full">
      <div className="p-4 bg-background-2 flex flex-col gap-4 min-h-[300px]">
        {/* Add block action button */}
        {!isAddingBlock ? (
          <button
            type="button"
            data-testid="add-block-btn"
            onClick={() => setIsAddingBlock(true)}
            className="flex items-center gap-3 p-3 rounded-lg bg-background-3 hover:bg-background-4 text-primary-9 transition-colors text-left font-medium text-sm"
          >
            <Icon icon={UserPlus} label="add-user-icon" className="w-5 h-5 text-primary-9" />
            <span>Añadir contacto para bloquear</span>
          </button>
        ) : (
          <div className="flex flex-col gap-2 p-3 bg-background-3 rounded-lg border border-background-6">
            <div className="flex items-center justify-between pb-2 border-b border-background-5">
              <span className="text-sm font-semibold text-background-12">
                Selecciona un contacto para bloquear
              </span>
              <button
                type="button"
                onClick={() => setIsAddingBlock(false)}
                className="p-1 rounded hover:bg-background-4 text-background-10"
                aria-label="Cerrar selección"
              >
                <Icon icon={X} label="close-icon" className="w-4 h-4" />
              </button>
            </div>

            {availableToBlock.length === 0 ? (
              <p className="text-xs text-background-11 py-2">
                No hay contactos disponibles para bloquear
              </p>
            ) : (
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                {availableToBlock.map((c) => {
                  const targetId = c.contactUserId || c.contact.id;
                  return (
                    <button
                      key={targetId}
                      type="button"
                      disabled={isBlocking}
                      onClick={() => {
                        blockUser(targetId, {
                          onSuccess: () => setIsAddingBlock(false),
                        });
                      }}
                      className="flex items-center gap-3 p-2 rounded hover:bg-background-4 text-left transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-background-5 flex items-center justify-center overflow-hidden shrink-0">
                        {c.contact.pictureUrl ? (
                          <img
                            src={c.contact.pictureUrl}
                            alt={c.contact.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-background-11">
                            {c.contact.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-background-12 truncate">
                          {c.contact.name}
                        </p>
                        {c.contact.email && (
                          <p className="text-xs text-background-11 truncate">
                            {c.contact.email}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* List of blocked contacts */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-background-11 px-1">
            Usuarios bloqueados ({blockedUsers.length})
          </h3>

          {blockedUsers.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
              <Icon
                icon={UserX}
                label="no-blocked-icon"
                className="w-10 h-10 text-background-9 stroke-1"
              />
              <p data-testid="no-blocked-users" className="text-sm text-background-11">
                No tienes contactos bloqueados
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-background-5">
              {blockedUsers.map((item) => {
                const targetId = item.id;
                const displayName = item.name || item.user?.name || "Usuario";
                const displayBio = item.bio || item.user?.bio || item.email || item.user?.email || "";
                const displayPicture = item.pictureUrl || item.user?.pictureUrl || "";

                return (
                  <div
                    key={targetId}
                    className="flex items-center justify-between py-3 px-2 gap-3 hover:bg-background-3/50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-background-5 flex items-center justify-center overflow-hidden shrink-0">
                        {displayPicture ? (
                          <img
                            src={displayPicture}
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-background-11">
                            {displayName.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-background-12 truncate">
                          {displayName}
                        </h4>
                        {displayBio && (
                          <p className="text-xs text-background-11 truncate">
                            {displayBio}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outlined"
                      data-testid="unblock-btn"
                      disabled={isUnblocking}
                      onClick={() => unblockUser(targetId)}
                      className="shrink-0 text-xs px-3 py-1.5"
                    >
                      Desbloquear
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
