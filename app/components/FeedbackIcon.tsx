import { Check, TriangleAlert } from "lucide-react";

const FeedbackIcon = ({
  type,
  className = "size-4 shrink-0",
}: {
  type: "good" | "improve";
  className?: string;
}) => {
  const Icon = type === "good" ? Check : TriangleAlert;
  return <Icon className={className} strokeWidth={2} aria-hidden="true" />;
};

export default FeedbackIcon;
