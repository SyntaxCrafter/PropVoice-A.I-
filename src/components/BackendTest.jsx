import { useState } from "react";

function BackendTest() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const testBackend = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/test"
      );

      const data = await response.json();

      setMessage(data.message);

    } catch (error) {
      setMessage("Could not connect to backend.");
      console.error(error);

    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="conversation-card">

      <div className="card-title">
        <span>BACKEND CONNECTION</span>
      </div>

      <button
        className="start-button"
        onClick={testBackend}
      >
        {loading ? "Connecting..." : "Test Backend"}
      </button>

      {message && (
        <p style={{ marginTop: "20px" }}>
          {message}
        </p>
      )}

    </section>
  );
}

export default BackendTest;