import { useEffect } from "react";

import emojiRegex from "emoji-regex";

import {
  $insertNodes,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  TextNode
} from "lexical";
import { mergeRegister } from "@lexical/utils";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { $createEmojiNode, EmojiNode } from "@/editor/nodes/EmojiNode";
import { TEmoji } from "@/lib/types";
import { EMOJI_IMAGES_PATH } from "@/lib/utils/constants";

export const INSERT_EMOJI = createCommand("INSERT_EMOJI");

const emojis: Record<string, TEmoji> = await import(
  "@/assets/emojis-dictionary-pretty.json"
).then((file) => file.default);

const EmojiRegex = emojiRegex();

const hasEmojiUnicode = (text: string) => EmojiRegex.test(text);

function findAndTransformEmoji(node: TextNode): null | TextNode {
  const text = node.getTextContent();

  // Se obtienen todas las coincidencias de emojis en unicode dentro del texto del nodo
  const allMatches = [...text.matchAll(EmojiRegex)];

  // Si no hay coincidencias no se transforma nada
  if (allMatches.length <= 0) return null;

  // Dividimos el nodo en los limites donde hay emojis
  // Ejemplo:
  // nodo original -> "😀 Texto restante del nodo 😘"
  // nodos dividido -> "😀"; " Texto restante del nodo "; "😘"
  const offsets: number[] = [];
  for (const match of allMatches) {
    const startOffset = match.index as number; // Si hay coincidencia index no puede ser indefinido;
    const endOffset = startOffset + match[0].length;

    offsets.push(startOffset, endOffset);
  }
  const nodes = node.splitText(...offsets);

  // Por cada nodo: Si este tiene un emoji se crea un nuevo EmojiNode
  // y se reemplaza el nodo antiguo
  for (const targetNode of nodes) {
    const textNode = targetNode.getTextContent();

    // Chequea si el texto tiene un emoji o no el emoji no existe en el diccionario,
    // si no cumple entonces continua al siguiente nodo;
    if (!hasEmojiUnicode(textNode)) continue;

    const imageUrl = `${EMOJI_IMAGES_PATH}/32/${emojis[textNode].image}`;

    // Nuevo EmojiNode que sustituirá al TextNode
    const emojiNode = $createEmojiNode(textNode, imageUrl);

    // Se reemplaza el nodo
    targetNode.replace(emojiNode);
  }

  return null;
}

const textNodeTransform = (node: TextNode) => {
  let targetNode: TextNode | null = node;
  while (targetNode !== null) {
    // Si el nodo esta en modo "token" o "segmented" no se transforma
    if (!targetNode.isSimpleText()) return;

    targetNode = findAndTransformEmoji(targetNode);
  }
};

const insertEmojiCommand = ({ native, image }: TEmoji) => {
  const imageUrl = `${EMOJI_IMAGES_PATH}/32/${image}`;

  const emojiNode = $createEmojiNode(native, imageUrl);

  $insertNodes([emojiNode]);
  return true;
};

export function EmojiPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (!editor.hasNodes([EmojiNode])) {
      throw new Error("EmojisPlugin: EmojiNode not registered on editor");
    }

    return mergeRegister(
      editor.registerNodeTransform(TextNode, textNodeTransform),
      editor.registerCommand(
        INSERT_EMOJI,
        insertEmojiCommand,
        COMMAND_PRIORITY_EDITOR
      )
    );
  }, [editor]);

  return null;
}
