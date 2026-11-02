import React from 'react'
import { ShieldAlert, ShieldCheck } from 'lucide-react'
import FeedbackIcon from './FeedbackIcon'

interface Suggestion {
  type: "good" | "improve";
  tip: string;
}

interface ATSProps {
  score: number;
  suggestions: Suggestion[];
}

const ATS: React.FC<ATSProps> = ({ score, suggestions }) => {
  const statusClass = score > 69
    ? 'ats-good'
    : score > 49
      ? 'ats-warning'
      : 'ats-bad';

  const StatusIcon = score > 69 ? ShieldCheck : ShieldAlert;

  // Determine subtitle based on score
  const subtitle = score > 69
    ? 'Great Job!'
    : score > 49
      ? 'Good Start'
      : 'Needs Improvement';

  return (
    <div className={`ats-panel ${statusClass}`}>
      {/* Top section with icon and headline */}
      <div className="flex items-center gap-4 mb-6">
        <span className="ats-icon"><StatusIcon className="size-6" aria-hidden="true" /></span>
        <div>
          <h2 className="text-xl font-semibold">ATS Score - {score}/100</h2>
        </div>
      </div>

      {/* Description section */}
      <div>
        <h3 className="text-xl font-semibold mb-2">{subtitle}</h3>
        <p className="text-gray-600 mb-4">
          This score represents how well your resume is likely to perform in Applicant Tracking Systems used by employers.
        </p>

        {/* Suggestions list */}
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-start gap-3">
              <FeedbackIcon type={suggestion.type} className={`size-4 shrink-0 mt-1 ${suggestion.type === "good" ? "text-score-good" : "text-score-warning"}`} />
              <p className={suggestion.type === "good" ? "text-score-good" : "text-score-warning"}>
                {suggestion.tip}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

export default ATS
