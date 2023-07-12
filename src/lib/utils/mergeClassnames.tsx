import cx, { ArgumentArray } from "classnames";
import { twMerge } from "tailwind-merge";

export default function mergeClassnames(...inputs: ArgumentArray) {
  return twMerge(cx(inputs));
}
