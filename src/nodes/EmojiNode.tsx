import {
  EditorConfig,
  NodeKey,
  TextNode,
  SerializedTextNode,
  Spread,
  $applyNodeReplacement,
  LexicalNode
} from "lexical";

type SerializedEmojiNode = Spread<
  {
    native: string;
    image: string;
  },
  SerializedTextNode
>;

export class EmojiNode extends TextNode {
  __native;
  __image;

  static getType(): string {
    return "emoji";
  }

  static clone(node: EmojiNode) {
    return new EmojiNode(node.__native, node.__image, node.__key);
  }

  constructor(native: string, image: string, key?: NodeKey) {
    super(native, key);
    this.__native = native;
    this.__image = image;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    const theme = config.theme;
    const className = theme.emoji;
    if (className !== undefined) {
      span.className = className;
    }

    span.style.backgroundImage = `url(${this.getImage()})`;

    const inner = super.createDOM(config);
    inner.textContent = this.getNative();

    span.appendChild(inner);

    return span;
  }

  updateDOM(
    prevNode: TextNode,
    dom: HTMLElement,
    config: EditorConfig
  ): boolean {
    const inner = dom.firstChild;
    if (inner === null) {
      return true;
    }

    super.updateDOM(prevNode, inner as HTMLElement, config);
    return false;
  }

  static importJSON(serializedNode: SerializedEmojiNode): EmojiNode {
    const node = $createEmojiNode(serializedNode.native, serializedNode.image);

    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);

    return node;
  }

  exportJSON(): SerializedEmojiNode {
    return {
      ...super.exportJSON(),
      native: this.__native,
      image: this.__image,
      type: "emoji",
      version: 1
    };
  }

  getNative() {
    const self = this.getLatest();
    return self.__native;
  }

  getImage() {
    const self = this.getLatest();
    return self.__image;
  }
}

export function $isEmojiNode(node: LexicalNode | null | undefined) {
  return node instanceof EmojiNode;
}

export function $createEmojiNode(native: string, image: string): EmojiNode {
  const node = new EmojiNode(native, image).setMode("token");

  return $applyNodeReplacement(node);
}
