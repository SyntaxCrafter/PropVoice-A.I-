function Conversation() {
  return (
    <section className="conversation-card">

      <div className="card-title">
        <span>CONVERSATION</span>
        <span>0 messages</span>
      </div>

      <div className="empty-conversation">

        <div className="conversation-icon">
          💬
        </div>

        <h3>Waiting to start conversation</h3>

        <p>
          Start a voice conversation with Aanya AI
          to begin qualifying the lead.
        </p>

      </div>

    </section>
  );
}

export default Conversation;