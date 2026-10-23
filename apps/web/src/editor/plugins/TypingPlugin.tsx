import { useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { getSocket } from "@/lib/socket/socketClient";

export function TypingPlugin({ chatId }: { chatId: string }) {
  const [editor] = useLexicalComposerContext();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    return editor.registerUpdateListener(({ dirtyElements, dirtyLeaves }) => {
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;
      const socket = getSocket();

      if (!isTypingRef.current) {
        isTypingRef.current = true;
        socket.emit("chat:typing", { chatId, isTyping: true });
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        isTypingRef.current = false;
        socket.emit("chat:typing", { chatId, isTyping: false });
      }, 2000);
    });
  }, [editor, chatId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (isTypingRef.current) {
        isTypingRef.current = false;
        const socket = getSocket();
        socket.emit("chat:typing", { chatId, isTyping: false });
      }
    };
  }, [chatId]);

  return null;
}
