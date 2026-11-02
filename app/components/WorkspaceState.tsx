import { type LucideIcon } from "lucide-react";
import { type ReactNode, useId } from "react";

const WorkspaceState = ({ icon: Icon, title, description, children, role }: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
  role?: "status" | "alert";
}) => {
  const titleId = useId();
  return (
    <section className="workspace-state" aria-labelledby={titleId} role={role}>
      <span className="workspace-state-icon"><Icon size={24} strokeWidth={1.5} aria-hidden="true" /></span>
      <h2 id={titleId}>{title}</h2>
      <p>{description}</p>
      {children && <div className="workspace-state-actions">{children}</div>}
    </section>
  );
};

export default WorkspaceState;
