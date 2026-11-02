import ATS from "./ATS";
import Details from "./Details";
import Summary from "./Summary";

const ReviewResults = ({ feedback, defaultOpen }: { feedback: Feedback; defaultOpen?: string }) => (
  <div className="review-results">
    <Summary feedback={feedback} />
    <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []} />
    <Details feedback={feedback} defaultOpen={defaultOpen} />
  </div>
);

export default ReviewResults;
