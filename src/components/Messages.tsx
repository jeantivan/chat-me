import { forwardRef, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}
export type Ref = HTMLDivElement;

export const Messages = forwardRef<Ref, Props>(({ children }, ref) => (
  <div
    className="messages overflow-y-auto bg-neutral-200 dark:bg-slate-900"
    ref={ref}
  >
    <div className="flex flex-col-reverse py-5">{children}</div>
  </div>
));
