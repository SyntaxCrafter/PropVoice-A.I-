function LeadProfile() {
  return (
    <section className="lead-card">

      <div className="card-title">
        <span>LIVE LEAD INTELLIGENCE</span>
        <span>●</span>
      </div>

      <div className="lead-grid">

        <div className="lead-item">
          <span>Customer</span>
          <strong>Not captured</strong>
        </div>

        <div className="lead-item">
          <span>Intent</span>
          <strong>Not specified</strong>
        </div>

        <div className="lead-item">
          <span>Location</span>
          <strong>Not specified</strong>
        </div>

        <div className="lead-item">
          <span>Property</span>
          <strong>Not specified</strong>
        </div>

        <div className="lead-item">
          <span>Budget</span>
          <strong>Not specified</strong>
        </div>

        <div className="lead-item">
          <span>Timeline</span>
          <strong>Not specified</strong>
        </div>

      </div>

      <div className="score-box">
        <span>LEAD SCORE</span>
        <strong>0 / 100</strong>
        <small>No lead data yet</small>
      </div>

    </section>
  );
}

export default LeadProfile;