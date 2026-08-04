import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:5000";

const initialLead = {
  name: null,
  phone: null,
  intent: null,
  location: null,
  property_type: null,
  configuration: null,
  budget_min: null,
  budget_max: null,
  purpose: null,
  timeline: null,
};

const initialMessage = {
  sender: "agent",
  text:
    "Namaste! Main Aanya hoon, PropVoice AI ki real estate assistant. Aap property buy karna chahte hain ya investment ke liye dekh rahe hain?",
};

function App() {
  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [lead, setLead] = useState(initialLead);

  const [leadScore, setLeadScore] = useState({
    score: 0,
    status: "COLD",
  });

  const [callStarted, setCallStarted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const [isListening, setIsListening] = useState(false);

  const [activeView, setActiveView] = useState("call");

  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  const [selectedLead, setSelectedLead] = useState(null);

  const [showSummary, setShowSummary] = useState(false);
  const [callSummary, setCallSummary] = useState("");
  const [nextAction, setNextAction] = useState("");

  /* =========================
     CALL TIMER
  ========================= */

  useEffect(() => {
    if (!callStarted) return;

    const timer = setInterval(() => {
      setCallDuration((time) => time + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [callStarted]);

  /* =========================
     HELPERS
  ========================= */

  const formatDuration = () => {
    const minutes = Math.floor(callDuration / 60);
    const seconds = callDuration % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  };

  const formatBudget = (value) => {
    if (!value) return "Not specified";

    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    }

    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)} L`;
    }

    return `₹${value}`;
  };

  const speak = (text) => {
    if (!text || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = "hi-IN";
    speech.rate = 0.95;

    window.speechSynthesis.speak(speech);
  };

  /* =========================
     SEND MESSAGE
  ========================= */

  const sendMessage = async (voiceText = null) => {
    const message = voiceText || input.trim();

    if (!message || isLoading) return;

    setCallStarted(true);

    setMessages((previous) => [
      ...previous,
      {
        sender: "user",
        text: message,
      },
    ]);

    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
        }),
      });

      if (!response.ok) {
        throw new Error("Backend error");
      }

      const data = await response.json();

      if (data.lead) {
        setLead((previous) => ({
          ...previous,
          ...data.lead,
        }));
      }

      if (data.lead_score) {
        setLeadScore({
          score: data.lead_score.score || 0,
          status: data.lead_score.status || "COLD",
        });
      }

      const reply =
        data.reply ||
        "Sorry, I could not generate a response.";

      setMessages((previous) => [
        ...previous,
        {
          sender: "agent",
          text: reply,
        },
      ]);

      speak(reply);
    } catch (error) {
      console.error(error);

      setMessages((previous) => [
        ...previous,
        {
          sender: "agent",
          text:
            "Backend connection failed. Please make sure the Flask server is running on port 5000.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================
     VOICE INPUT
  ========================= */

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice recognition is not supported. Please use Google Chrome."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "hi-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript =
        event.results[0][0].transcript;

      setInput(transcript);
      sendMessage(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  /* =========================
     RESET
  ========================= */

  const resetConversation = async () => {
    try {
      await fetch(`${API_BASE}/api/reset`, {
        method: "POST",
      });
    } catch (error) {
      console.error(error);
    }

    setMessages([initialMessage]);
    setLead(initialLead);

    setLeadScore({
      score: 0,
      status: "COLD",
    });

    setInput("");
    setCallStarted(false);
    setCallDuration(0);

    setShowSummary(false);
    setCallSummary("");
    setNextAction("");

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  /* =========================
     LOAD CRM
  ========================= */

  const loadLeads = async () => {
    setLoadingLeads(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/leads`
      );

      const data = await response.json();

      if (data.status === "success") {
        setLeads(data.leads || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingLeads(false);
    }
  };

  const openCRM = () => {
    setActiveView("crm");
    loadLeads();
  };

  /* =========================
     END CALL
  ========================= */

  const endCall = async () => {
    window.speechSynthesis?.cancel();

    setCallStarted(false);

    const summary = `
Customer is interested in ${
      lead.configuration || "a property"
    } in ${lead.location || "the preferred location"}.

Intent: ${lead.intent || "Not specified"}.

Budget: ${
      lead.budget_max
        ? formatBudget(lead.budget_max)
        : "Not specified"
    }.

Purpose: ${lead.purpose || "Not specified"}.

Timeline: ${lead.timeline || "Not specified"}.

Lead Score: ${leadScore.score}/100.

Lead Status: ${leadScore.status}.
    `.trim();

    let action =
      "Continue nurturing the lead and collect missing details.";

    if (leadScore.status === "HOT") {
      action =
        "Immediate sales follow-up recommended. Schedule a property discussion or site visit.";
    } else if (leadScore.status === "WARM") {
      action =
        "Follow up within 24 hours and collect remaining qualification details.";
    }

    setCallSummary(summary);
    setNextAction(action);
    setShowSummary(true);

    try {
      const response = await fetch(`${API_BASE}/api/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lead: lead,
          lead_score: leadScore,
          summary: summary,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save lead");
      }

      loadLeads();
    } catch (error) {
      console.error("Save lead error:", error);
    }
  };

  /* =========================
     STATS
  ========================= */

  const hotLeads = leads.filter(
    (item) => item.lead_status === "HOT"
  ).length;

  const warmLeads = leads.filter(
    (item) => item.lead_status === "WARM"
  ).length;

  const coldLeads = leads.filter(
    (item) => item.lead_status === "COLD"
  ).length;

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">
          <div className="logo">P</div>

          <div>
            <h2>PropVoice</h2>
            <span>AI PLATFORM</span>
          </div>
        </div>

        <div className="nav-title">
          WORKSPACE
        </div>

        <button
          className={
            activeView === "call"
              ? "nav-button active"
              : "nav-button"
          }
          onClick={() => setActiveView("call")}
        >
          ◉
          <span>AI Call</span>
        </button>

        <button
          className={
            activeView === "crm"
              ? "nav-button active"
              : "nav-button"
          }
          onClick={openCRM}
        >
          ▦
          <span>Lead Intelligence</span>

          {leads.length > 0 && (
            <b>{leads.length}</b>
          )}
        </button>

        <div className="sidebar-bottom">

          <div className="system">
            <span className="green-dot"></span>

            <div>
              <strong>AI Engine</strong>
              <small>Operational</small>
            </div>
          </div>

          <div className="admin">
            <div className="avatar">
              VT
            </div>

            <div>
              <strong>Workspace Admin</strong>
              <small>PropVoice Operations</small>
            </div>
          </div>

        </div>

      </aside>

      {/* MAIN */}

      <div className="main">

        <header className="header">

          <div>
            <span>
              {activeView === "call"
                ? "CONVERSATION CENTER"
                : "SALES INTELLIGENCE"}
            </span>

            <strong>
              /
            </strong>

            <span>
              {activeView === "call"
                ? "Live AI Session"
                : "Lead Pipeline"}
            </span>
          </div>

          <div className="header-right">

            <span className="system-online">
              ● All systems operational
            </span>

            {activeView === "call" && (
              <div className="session-time">
                <small>SESSION</small>
                <strong>
                  {formatDuration()}
                </strong>
              </div>
            )}

            <div className="header-avatar">
              VT
            </div>

          </div>

        </header>

        {/* =====================
            CALL VIEW
        ===================== */}

        {activeView === "call" && (

          <main className="workspace">

            <div className="page-title">

              <div>
                <span>AI SALES AGENT</span>

                <h1>
                  Conversation Workspace
                </h1>

                <p>
                  Qualify, understand and route
                  real estate prospects in real time.
                </p>
              </div>

              <div className="page-actions">

                <button
                  className="secondary-button"
                  onClick={resetConversation}
                >
                  New session
                </button>

                <button
                  className="danger-button"
                  onClick={endCall}
                >
                  End session
                </button>

              </div>

            </div>

            <div className="content-grid">

              {/* CHAT */}

              <section className="chat-card">

                <div className="chat-header">

                  <div className="agent">

                    <div className="agent-orb">
                      A
                    </div>

                    <div>
                      <div className="agent-name">
                        Aanya
                        <span>LIVE</span>
                      </div>

                      <p>
                        AI Real Estate Sales Executive
                      </p>
                    </div>

                  </div>

                  <span className="languages">
                    HI / EN / HINGLISH
                  </span>

                </div>

                <div className="messages">

                  <div className="session-marker">
                    <span></span>
                    SESSION STARTED
                    <span></span>
                  </div>

                  {messages.map(
                    (message, index) => (

                      <div
                        key={index}
                        className={
                          message.sender === "agent"
                            ? "message agent-message"
                            : "message user-message"
                        }
                      >

                        <div className="message-avatar">
                          {message.sender === "agent"
                            ? "A"
                            : "YOU"}
                        </div>

                        <div>

                          <div className="message-meta">
                            <strong>
                              {message.sender ===
                              "agent"
                                ? "Aanya"
                                : "Prospect"}
                            </strong>

                            <span>
                              {message.sender ===
                              "agent"
                                ? "AI Agent"
                                : "Customer"}
                            </span>
                          </div>

                          <div className="bubble">
                            {message.text}
                          </div>

                        </div>

                      </div>
                    )
                  )}

                  {isLoading && (
                    <div className="thinking">
                      Aanya is processing...
                    </div>
                  )}

                </div>

                <div className="composer-area">

                  <div className="composer">

                    <button
                      className={
                        isListening
                          ? "voice recording"
                          : "voice"
                      }
                      onClick={startListening}
                    >
                      {isListening ? "■" : "🎙"}
                    </button>

                    <input
                      value={input}
                      onChange={(event) =>
                        setInput(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          sendMessage();
                        }
                      }}
                      placeholder="Type a message in Hindi, Hinglish or English..."
                    />

                    <button
                      className="send"
                      onClick={() => sendMessage()}
                      disabled={isLoading}
                    >
                      Send ↗
                    </button>

                  </div>

                  <div className="composer-footer">
                    <span>
                      AI-powered qualification
                    </span>

                    <span>
                      Press Enter to send
                    </span>
                  </div>

                </div>

              </section>

              {/* INTELLIGENCE */}

              <aside className="intelligence">

                <div className="panel-title">

                  <div>
                    <span>REAL-TIME</span>
                    <h2>Lead Intelligence</h2>
                  </div>

                  <small>
                    ● CAPTURING
                  </small>

                </div>

                {/* SCORE */}

                <div className="score-card">

                  <span>
                    QUALIFICATION SCORE
                  </span>

                  <div className="score-number">
                    {leadScore.score}
                    <small>/100</small>
                  </div>

                  <div className="score-status">
                    {leadScore.status}
                  </div>

                  <div className="progress">
                    <div
                      style={{
                        width: `${leadScore.score}%`,
                      }}
                    ></div>
                  </div>

                  <p>
                    {leadScore.status === "HOT"
                      ? "High purchase intent detected."
                      : leadScore.status === "WARM"
                      ? "Positive buying signals detected."
                      : "Qualification is in progress."}
                  </p>

                </div>

                {/* PROFILE */}

                <div className="profile">

                  <div className="profile-heading">
                    <h3>Prospect profile</h3>
                    <span>AI extracted</span>
                  </div>

                  <ProfileField
                    label="NAME"
                    value={lead.name}
                  />

                  <ProfileField
                    label="PHONE"
                    value={lead.phone}
                  />

                  <ProfileField
                    label="LOCATION"
                    value={lead.location}
                  />

                  <ProfileField
                    label="INTENT"
                    value={lead.intent}
                  />

                  <ProfileField
                    label="PROPERTY"
                    value={lead.property_type}
                  />

                  <ProfileField
                    label="CONFIGURATION"
                    value={lead.configuration}
                  />

                  <ProfileField
                    label="BUDGET"
                    value={
                      lead.budget_max
                        ? formatBudget(lead.budget_max)
                        : null
                    }
                  />

                  <ProfileField
                    label="PURPOSE"
                    value={lead.purpose}
                  />

                  <ProfileField
                    label="TIMELINE"
                    value={lead.timeline}
                  />

                </div>

                {/* RECOMMENDATION */}

                <div className="recommendation">

                  <span>✦ AI RECOMMENDATION</span>

                  <h3>
                    Aarohan Heights
                  </h3>

                  <p>
                    Noida Extension · 2, 3 & 4 BHK
                  </p>

                  <div>
                    <strong>
                      ₹78L – ₹1.35Cr
                    </strong>

                    <b>
                      MATCH 94%
                    </b>
                  </div>

                </div>

              </aside>

            </div>

            {/* SUMMARY */}

            {showSummary && (

              <section className="summary">

                <div className="summary-header">

                  <div>
                    <span>SESSION OUTCOME</span>

                    <h2>
                      Call successfully completed
                    </h2>
                  </div>

                  <b>
                    ✓ LEAD SAVED
                  </b>

                </div>

                <div className="summary-stats">

                  <div>
                    <small>DURATION</small>
                    <strong>
                      {formatDuration()}
                    </strong>
                  </div>

                  <div>
                    <small>SCORE</small>
                    <strong>
                      {leadScore.score}/100
                    </strong>
                  </div>

                  <div>
                    <small>STATUS</small>
                    <strong>
                      {leadScore.status}
                    </strong>
                  </div>

                </div>

                <h3>
                  Conversation summary
                </h3>

                <p>
                  {callSummary}
                </p>

                <div className="next-action">
                  <strong>
                    RECOMMENDED ACTION
                  </strong>

                  <p>
                    {nextAction}
                  </p>
                </div>

              </section>
            )}

          </main>
        )}

        {/* =====================
            CRM VIEW
        ===================== */}

        {activeView === "crm" && (

          <main className="crm">

            <div className="page-title">

              <div>
                <span>SALES INTELLIGENCE</span>

                <h1>
                  Lead Pipeline
                </h1>

                <p>
                  Centralized view of AI-qualified
                  real estate prospects.
                </p>
              </div>

              <button
                className="secondary-button"
                onClick={loadLeads}
              >
                ↻ Refresh data
              </button>

            </div>

            {/* KPI */}

            <div className="kpis">

              <Kpi
                title="TOTAL PROSPECTS"
                value={leads.length}
              />

              <Kpi
                title="HOT OPPORTUNITIES"
                value={hotLeads}
              />

              <Kpi
                title="WARM OPPORTUNITIES"
                value={warmLeads}
              />

              <Kpi
                title="COLD PROSPECTS"
                value={coldLeads}
              />

            </div>

            {/* TABLE */}

            <section className="pipeline">

              <div className="pipeline-header">

                <div>
                  <h2>
                    Prospect records
                  </h2>

                  <span>
                    {leads.length} records available
                  </span>
                </div>

              </div>

              {loadingLeads ? (

                <div className="empty">
                  Loading intelligence...
                </div>

              ) : leads.length === 0 ? (

                <div className="empty">

                  <h3>
                    No prospects yet
                  </h3>

                  <p>
                    Complete an AI call to create
                    your first qualified lead.
                  </p>

                  <button
                    className="send"
                    onClick={() =>
                      setActiveView("call")
                    }
                  >
                    Start AI session
                  </button>

                </div>

              ) : (

                <div className="table-container">

                  <table>

                    <thead>
                      <tr>
                        <th>PROSPECT</th>
                        <th>LOCATION</th>
                        <th>PROPERTY</th>
                        <th>BUDGET</th>
                        <th>SCORE</th>
                        <th>STATUS</th>
                        <th>CREATED</th>
                      </tr>
                    </thead>

                    <tbody>

                      {leads.map((item) => (

                        <tr
                          key={item.id}
                          onClick={() =>
                            setSelectedLead(item)
                          }
                        >

                          <td>
                            <strong>
                              {item.name ||
                                "Unknown Prospect"}
                            </strong>

                            <small>
                              {item.phone ||
                                "Phone not captured"}
                            </small>
                          </td>

                          <td>
                            {item.location || "—"}
                          </td>

                          <td>
                            {item.configuration ||
                              item.property_type ||
                              "Property"}
                          </td>

                          <td>
                            {formatBudget(
                              item.budget_max ||
                                item.budget_min
                            )}
                          </td>

                          <td>
                            {item.lead_score || 0}/100
                          </td>

                          <td>
                            <span
                              className={`status ${String(
                                item.lead_status ||
                                  "COLD"
                              ).toLowerCase()}`}
                            >
                              ●{" "}
                              {item.lead_status ||
                                "COLD"}
                            </span>
                          </td>

                          <td>
                            {item.created_at
                              ? new Date(
                                  item.created_at
                                ).toLocaleDateString(
                                  "en-IN"
                                )
                              : "—"}
                          </td>

                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>
              )}

            </section>

            {selectedLead && (

              <section className="selected-lead">

                <div>
                  <span>SELECTED PROSPECT</span>

                  <h2>
                    {selectedLead.name ||
                      "Unknown Prospect"}
                  </h2>
                </div>

                <div className="selected-grid">

                  <ProfileField
                    label="PHONE"
                    value={selectedLead.phone}
                  />

                  <ProfileField
                    label="LOCATION"
                    value={selectedLead.location}
                  />

                  <ProfileField
                    label="INTENT"
                    value={selectedLead.intent}
                  />

                  <ProfileField
                    label="BUDGET"
                    value={formatBudget(
                      selectedLead.budget_max ||
                        selectedLead.budget_min
                    )}
                  />

                </div>

                <button
                  className="secondary-button"
                  onClick={() =>
                    setSelectedLead(null)
                  }
                >
                  Close
                </button>

              </section>
            )}

          </main>
        )}

      </div>
    </div>
  );
}

/* =========================
   PROFILE FIELD
========================= */

function ProfileField({ label, value }) {
  return (
    <div className="profile-field">
      <span>{label}</span>
      <strong>{value || "Not captured"}</strong>
    </div>
  );
}

/* =========================
   KPI
========================= */

function Kpi({ title, value }) {
  return (
    <div className="kpi">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>AI captured</small>
    </div>
  );
}

export default App;