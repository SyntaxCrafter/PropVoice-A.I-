import { useState } from "react";

function VoiceAgent() {
     const [isCalling, setIsCalling] = useState(false);
  return (
    <section className="agent-card">

      <div className="card-title">
        <span>AI VOICE AGENT</span>
        <span className="live-badge">LIVE</span>
      </div>

      <div className="agent-avatar">
  {isCalling ? "📞" : "🤖"}
</div>

      <h2>Aanya AI</h2>

      <p className="agent-description">
        Your multilingual real estate sales assistant
      </p>

      <div className="agent-status">

  <span className="status-dot"></span>

  {isCalling ? "Call in progress..." : "Ready to talk"}

</div>

      <button
  className="start-button"
  onClick={() => setIsCalling(!isCalling)}
>
  {isCalling ? "📞 End Conversation" : "🎙️ Start Conversation"}
</button>

    </section>
  );
}

export default VoiceAgent;