import { ShieldCheck, ShieldAlert, UserMinus } from "lucide-react";
import type { ChatParticipantSummary } from "@chat-me/shared";

interface GroupParticipantItemProps {
  participant: ChatParticipantSummary;
  isSelf: boolean;
  isAdmin: boolean;
  isOnline: boolean;
  onToggleRole: (userId: string, currentRole: string) => void;
  onRemove: (userId: string) => void;
}

export function GroupParticipantItem({
  participant,
  isSelf,
  isAdmin,
  isOnline,
  onToggleRole,
  onRemove,
}: GroupParticipantItemProps) {
  const p = participant;

  return (
    <div className="flex items-center justify-between px-5 py-3 hover:bg-background-4 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-background-4 shrink-0">
          <img
            src={p.user?.pictureUrl || ""}
            alt={p.user?.name}
            className="w-full h-full object-cover"
          />
          {isOnline && (
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
            {isOnline ? "En línea" : "Desconectado"}
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
              onClick={() => onToggleRole(p.userId, p.role)}
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
              onClick={() => onRemove(p.userId)}
              className="p-1 rounded text-background-11 hover:text-red-500 hover:bg-background-6/20"
            >
              <UserMinus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
