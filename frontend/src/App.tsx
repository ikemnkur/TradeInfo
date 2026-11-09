import { Link, Route, Routes } from "react-router-dom";

type NavItem = {
  to: string;
  label: string;
};

const navItems: NavItem[] = [
  { to: "/", label: "Home" },
  { to: "/campaigns", label: "Campaigns" },
  { to: "/campaigns/new", label: "Create Campaign" },
  { to: "/wallet", label: "Wallet" },
  { to: "/wallet/collection", label: "Collection" },
  { to: "/wallet/compile", label: "Compile Key" },
  { to: "/wallet/credits", label: "Credits" },
  { to: "/account/register", label: "Register" },
  { to: "/payments/deposit", label: "Deposit" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/admin", label: "Admin" },
];

function App() {
  return (
    <main className="app-shell">
      <header>
        <h1>TradeInfo PWA Mock</h1>
        <p>Offline-friendly token clue game frontend</p>
      </header>
      <nav className="nav-grid">
        {navItems.map((item) => (
          <Link key={item.to} to={item.to}>
            {item.label}
          </Link>
        ))}
      </nav>
      <section className="page-card">
        <Routes>
          <Route
            path="/"
            element={
              <RoutePage
                title="Home"
                text="This is the PWA shell. Install it on mobile and navigate all mock routes."
              />
            }
          />
          <Route
            path="/campaigns"
            element={<RoutePage title="Campaigns" text="Campaign list UI placeholder." />}
          />
          <Route
            path="/campaigns/new"
            element={<RoutePage title="Create Campaign" text="Campaign creation form placeholder." />}
          />
          <Route
            path="/wallet"
            element={<RoutePage title="Wallet" text="Wallet overview and token import placeholder." />}
          />
          <Route
            path="/wallet/collection"
            element={<RoutePage title="Collection" text="Collection and duplicate counts placeholder." />}
          />
          <Route
            path="/wallet/compile"
            element={<RoutePage title="Compile Key" text="Unlock key compile flow placeholder." />}
          />
          <Route
            path="/wallet/credits"
            element={<RoutePage title="Credits" text="In-app credit balance and deposit history placeholder." />}
          />
          <Route
            path="/account/register"
            element={
              <RoutePage
                title="Register"
                text="Account registration requires ETH/BTC/SOL/LTC wallet addresses."
              />
            }
          />
          <Route
            path="/payments/deposit"
            element={
              <RoutePage
                title="Deposit"
                text="Create payment intent, send crypto to treasury wallet, then confirm tx."
              />
            }
          />
          <Route
            path="/leaderboard"
            element={<RoutePage title="Leaderboard" text="Competition and event ranking placeholder." />}
          />
          <Route
            path="/admin"
            element={<RoutePage title="Admin" text="Campaign moderation and transparency logs placeholder." />}
          />
          <Route path="*" element={<RoutePage title="Not Found" text="Route not found." />} />
        </Routes>
      </section>
    </main>
  );
}

function RoutePage({ title, text }: { title: string; text: string }) {
  return (
    <article>
      <h2>{title}</h2>
      <p>{text}</p>
    </article>
  );
}

export default App;
