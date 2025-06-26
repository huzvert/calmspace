import './App.css';

function App() {
  return (
    <div className="app">
      <header className="hero">
        <h1>🧘 CalmSpace</h1>
        <p>Your peaceful place to reflect on your mood.</p>
      </header>

      <main>
        <section className="mood-log">
          <h2>How are you feeling today?</h2>
          <button className="log-btn">Log My Mood</button>
        </section>

        <section className="stats-preview">
          <h3>Mood Stats</h3>
          <p>(Coming soon...)</p>
        </section>
      </main>

      <footer>
        <p>Built with 💙 by Huzaifa</p>
      </footer>
    </div>
  );
}

export default App;
