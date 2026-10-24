import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  CreditCard,
  Download,
  Home,
  LayoutDashboard,
  Lightbulb,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";

import "./App.css";

/* =========================================================
   CONFIGURATION
========================================================= */

const STORAGE_KEYS = {
  transactions: "spendwise-transactions",
  goals: "spendwise-goals",
  budgets: "spendwise-budgets",
};

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Transactions", icon: CreditCard },
  { label: "Budgets", icon: Wallet },
  { label: "Savings Goals", icon: Target },
  { label: "AI Insights", icon: Sparkles },
];

const initialTransactions = [
  {
    id: 1,
    name: "Salary",
    category: "Income",
    date: "Oct 24, 2026",
    amount: 25000,
    type: "income",
    color: "green",
  },
  {
    id: 2,
    name: "Grocery Store",
    category: "Food & Groceries",
    date: "Oct 23, 2026",
    amount: 1250,
    type: "expense",
    color: "orange",
  },
  {
    id: 3,
    name: "Electricity Bill",
    category: "Utilities",
    date: "Oct 22, 2026",
    amount: 850,
    type: "expense",
    color: "blue",
  },
  {
    id: 4,
    name: "Online Shopping",
    category: "Shopping",
    date: "Oct 21, 2026",
    amount: 1899,
    type: "expense",
    color: "pink",
  },
  {
    id: 5,
    name: "Freelance Project",
    category: "Income",
    date: "Oct 20, 2026",
    amount: 4500,
    type: "income",
    color: "purple",
  },
  {
    id: 6,
    name: "Bus Fare",
    category: "Transportation",
    date: "Oct 24, 2026",
    amount: 100,
    type: "expense",
    color: "blue",
  },
];

const initialGoals = [
  {
    id: 1,
    name: "New Laptop",
    saved: 18500,
    target: 45000,
    color: "purple",
  },
  {
    id: 2,
    name: "Emergency Fund",
    saved: 12000,
    target: 30000,
    color: "blue",
  },
  {
    id: 3,
    name: "Dream Vacation",
    saved: 8000,
    target: 25000,
    color: "pink",
  },
];

const initialBudgets = [
  {
    id: 1,
    name: "Food & Groceries",
    limit: 6000,
    color: "purple",
  },
  {
    id: 2,
    name: "Transportation",
    limit: 3000,
    color: "blue",
  },
  {
    id: 3,
    name: "Shopping",
    limit: 4000,
    color: "pink",
  },
  {
    id: 4,
    name: "Entertainment",
    limit: 2000,
    color: "orange",
  },
];

const categoryColors = {
  "Food & Groceries": "orange",
  Transportation: "blue",
  Shopping: "pink",
  Entertainment: "purple",
  Utilities: "blue",
  Education: "purple",
  Healthcare: "green",
  Income: "green",
  Other: "orange",
};

const categoryHexColors = {
  "Food & Groceries": "#9b87f5",
  Transportation: "#67b7f7",
  Shopping: "#f18cb6",
  Entertainment: "#f2b36d",
  Utilities: "#67b7f7",
  Education: "#9b87f5",
  Healthcare: "#55d6a7",
  Income: "#55d6a7",
  Other: "#f2b36d",
};

const categories = [
  "Food & Groceries",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Utilities",
  "Education",
  "Healthcare",
  "Income",
  "Other",
];

const goalColors = ["purple", "blue", "pink"];

/* =========================================================
   GENERAL UTILITIES
========================================================= */

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(Number(amount)) ? Number(amount) : 0);

function formatDate(date = new Date()) {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function readStoredData(key, fallback, validator) {
  try {
    const raw = window.localStorage.getItem(key);

    if (raw === null) {
      return fallback;
    }

    const parsed = JSON.parse(raw);

    return validator(parsed) ? parsed : fallback;
  } catch (error) {
    console.error(`Could not read ${key}:`, error);
    return fallback;
  }
}

function isValidTransactionList(value) {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        item.id !== undefined &&
        typeof item.name === "string" &&
        typeof item.category === "string" &&
        typeof item.amount === "number" &&
        Number.isFinite(item.amount) &&
        item.amount > 0 &&
        ["income", "expense"].includes(item.type)
    )
  );
}

function isValidGoalList(value) {
  return (
    Array.isArray(value) &&
    value.every(
      (goal) =>
        goal &&
        typeof goal.name === "string" &&
        typeof goal.target === "number" &&
        Number.isFinite(goal.target) &&
        goal.target > 0 &&
        typeof goal.saved === "number" &&
        Number.isFinite(goal.saved) &&
        goal.saved >= 0
    )
  );
}

function isValidBudgetList(value) {
  return (
    Array.isArray(value) &&
    value.every(
      (budget) =>
        budget &&
        typeof budget.name === "string" &&
        typeof budget.limit === "number" &&
        Number.isFinite(budget.limit) &&
        budget.limit > 0
    )
  );
}

function getTransactionIcon(transaction) {
  if (transaction.type === "income") {
    return ArrowDownLeft;
  }

  switch (transaction.category) {
    case "Food & Groceries":
      return Home;
    case "Transportation":
      return ArrowRight;
    case "Utilities":
      return Activity;
    default:
      return CreditCard;
  }
}

function getTransactionColor(transaction) {
  return (
    transaction.color ||
    categoryColors[transaction.category] ||
    "purple"
  );
}

function matchesTransaction(transaction, searchTerm) {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return [
    transaction.name,
    transaction.category,
    transaction.date,
    transaction.type,
    transaction.amount,
  ].some((value) => String(value).toLowerCase().includes(query));
}

function getMonthKey(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function isCurrentMonth(transaction) {
  const transactionMonth = getMonthKey(transaction.date);
  const currentMonth = getMonthKey(new Date());

  return transactionMonth === currentMonth;
}

/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({ activePage, setActivePage, open, onClose }) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      {open && (
        <button
          className="sidebar-overlay"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Wallet size={22} strokeWidth={2.2} />
          </div>

          <div>
            <span className="brand-name">
              spendwise<span>.</span>
            </span>
            <span className="brand-caption">PERSONAL FINANCE</span>
          </div>

          <button
            className="icon-button sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={19} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="navigation" aria-label="Main navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${
                activePage === label ? "nav-active" : ""
              }`}
              onClick={() => {
                setActivePage(label);
                onClose();
              }}
            >
              <Icon size={19} />
              <span>{label}</span>

              {label === "AI Insights" && (
                <span className="nav-new">NEW</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <div className="upgrade-card">
          <div className="upgrade-icon">
            <Sparkles size={18} />
          </div>

          <h3>Your money, smarter.</h3>

          <p>
            Understand your spending and make more confident decisions.
          </p>

          <button
            onClick={() => setActivePage("AI Insights")}
            className="upgrade-button"
          >
            Explore insights <ArrowRight size={15} />
          </button>
        </div>

        <div className="sidebar-bottom">
          <button
            className={`nav-item ${
              activePage === "Settings" ? "nav-active" : ""
            }`}
            onClick={() => {
              setActivePage("Settings");
              onClose();
            }}
          >
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <button
            className={`nav-item ${
              activePage === "Help & Support" ? "nav-active" : ""
            }`}
            onClick={() => {
              setActivePage("Help & Support");
              onClose();
            }}
          >
            <CircleHelp size={19} />
            <span>Help & Support</span>
          </button>

<div className="sidebar-account-wrapper">
  <button
    type="button"
    className="sidebar-profile"
    onClick={() => {
      setActivePage("My Account");
      setProfileOpen(false);
      onClose();
    }}
    aria-expanded={false}
    aria-label="Open My Account page"
  >
    <div className="avatar">S</div>

    <div className="profile-copy">
      <strong>Your account</strong>
      <span>Personal workspace</span>
    </div>

    <ChevronDown
      size={16}
      className={`muted-icon ${profileOpen ? "profile-chevron-open" : ""}`}
    />
  </button>

  {profileOpen && (
    <div className="profile-menu">
      <div className="profile-menu-heading">
        <div className="avatar">S</div>
        <div>
          <strong>Your account</strong>
          <span>SpendWise workspace</span>
        </div>
      </div>

      <div className="profile-menu-divider" />

      <button
        type="button"
        className="profile-menu-item"
        onClick={() => {
          setActivePage("Settings");
          setProfileOpen(false);
          onClose();
        }}
      >
        <Settings size={17} />
        <span>Settings & preferences</span>
      </button>

      <button
        type="button"
        className="profile-menu-item"
        onClick={() => {
          setActivePage("Help & Support");
          setProfileOpen(false);
          onClose();
        }}
      >
        <CircleHelp size={17} />
        <span>Help & Support</span>
      </button>

      <div className="profile-menu-divider" />

      <div className="profile-menu-note">
        <ShieldCheck size={15} />
        <span>Your data stays in this browser.</span>
      </div>
    </div>
  )}
</div>




        </div>
      </aside>
    </>
  );
}

/* =========================================================
   HEADER
========================================================= */

function Header({
  activePage,
  searchTerm,
  onSearchChange,
  onMenuClick,
  onAddTransaction,
  onNotifications,
}) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="icon-button mobile-menu"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>

        <div className="breadcrumb">
          <span>Workspace</span>
          <span className="breadcrumb-slash">/</span>
          <strong>{activePage}</strong>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="search-box">
          <Search size={17} />

          <input
            aria-label="Search transactions"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />

          {searchTerm ? (
            <button
              type="button"
              className="icon-button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          ) : (
            <kbd>Ctrl K</kbd>
          )}
        </div>

        <button
          className="icon-button notification-button"
          aria-label="Notifications"
          onClick={onNotifications}
        >
          <Bell size={19} />
          <span className="notification-dot" />
        </button>

        <button
          className="header-add-button"
          onClick={onAddTransaction}
        >
          <Plus size={17} />
          <span>Add transaction</span>
        </button>
      </div>
    </header>
  );
}

/* =========================================================
   REUSABLE UI
========================================================= */

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      {action}
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  positive,
  note,
}) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <div className={`metric-icon ${color}`}>
          <Icon size={20} />
        </div>

        <span
          className={`metric-change ${
            positive ? "change-positive" : "change-neutral"
          }`}
        >
          {positive ? (
            <ArrowUpRight size={14} />
          ) : (
            <ArrowDownLeft size={14} />
          )}

          {change}
        </span>
      </div>

      <div className="metric-label">{title}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-note">{note}</div>
    </article>
  );
}

/* =========================================================
   CASHFLOW CHART
   Uses the actual transactions recorded by the user.
========================================================= */

function CashflowChart({ transactions }) {
  const [period, setPeriod] = useState("This week");

  const chartData = useMemo(() => {
    const now = new Date();
    const days = [];

    for (let index = 6; index >= 0; index -= 1) {
      const day = new Date(now);
      day.setDate(now.getDate() - index);
      day.setHours(0, 0, 0, 0);

      days.push({
        date: day,
        day: day.toLocaleDateString("en-US", {
          weekday: "short",
        }),
        income: 0,
        expense: 0,
      });
    }

    transactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.date);

      if (Number.isNaN(transactionDate.getTime())) {
        return;
      }

      const match = days.find(
        (day) =>
          day.date.getFullYear() === transactionDate.getFullYear() &&
          day.date.getMonth() === transactionDate.getMonth() &&
          day.date.getDate() === transactionDate.getDate()
      );

      if (match) {
        if (transaction.type === "income") {
          match.income += transaction.amount;
        } else {
          match.expense += transaction.amount;
        }
      }
    });

    return days;
  }, [transactions]);

  const maxValue = Math.max(
    1,
    ...chartData.flatMap((item) => [item.income, item.expense])
  );

  const displayedData =
    period === "This week"
      ? chartData
      : chartData.slice(0, 7);

  return (
    <section className="panel cashflow-panel">
      <div className="panel-heading">
        <div>
          <h3>Cash flow</h3>
          <p>Track money coming in and going out</p>
        </div>

        <button
          className="select-button"
          onClick={() =>
            setPeriod((current) =>
              current === "This week" ? "Last week" : "This week"
            )
          }
          aria-label={`Current period: ${period}. Click to change period.`}
        >
          <CalendarDays size={15} />
          {period}
          <ChevronDown size={14} />
        </button>
      </div>

      <div className="chart-legend">
        <span>
          <i className="legend-dot legend-income" /> Income
        </span>

        <span>
          <i className="legend-dot legend-expense" /> Expenses
        </span>
      </div>

      <div className="chart-area">
        <div className="chart-y-labels">
          <span>{formatCurrency(maxValue)}</span>
          <span>{formatCurrency(maxValue * 0.75)}</span>
          <span>{formatCurrency(maxValue * 0.5)}</span>
          <span>{formatCurrency(maxValue * 0.25)}</span>
          <span>₹0</span>
        </div>

        <div className="chart-main">
          <div className="chart-grid">
            {[0, 1, 2, 3, 4].map((line) => (
              <div key={line} />
            ))}
          </div>

          <div className="bar-chart">
            {displayedData.map((item) => {
              const incomeHeight = (item.income / maxValue) * 100;
              const expenseHeight = (item.expense / maxValue) * 100;

              return (
                <div className="bar-group" key={item.day + item.date}>
                  <div className="bar-pair">
                    <div
                      className="bar bar-income"
                      style={{
                        height: `${incomeHeight}%`,
                        minHeight: item.income > 0 ? "3px" : "0",
                      }}
                      title={`Income: ${formatCurrency(item.income)}`}
                    />

                    <div
                      className="bar bar-expense"
                      style={{
                        height: `${expenseHeight}%`,
                        minHeight: item.expense > 0 ? "3px" : "0",
                      }}
                      title={`Expenses: ${formatCurrency(item.expense)}`}
                    />
                  </div>

                  <span className="bar-label">{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="form-hint">
        Chart values are calculated from your recorded transactions for the
        current week.
      </p>
    </section>
  );
}

/* =========================================================
   SPENDING BREAKDOWN
========================================================= */

function SpendingBreakdown({ transactions }) {
  const categoryTotals = transactions
    .filter(
      (item) =>
        item.type === "expense" &&
        isCurrentMonth(item)
    )
    .reduce((totals, item) => {
      totals[item.category] =
        (totals[item.category] || 0) + item.amount;

      return totals;
    }, {});

  const categoryList = Object.entries(categoryTotals)
    .map(([name, spent]) => ({
      name,
      spent,
      color: categoryColors[name] || "purple",
      hexColor: categoryHexColors[name] || "#9b87f5",
    }))
    .sort((a, b) => b.spent - a.spent);

  const total = categoryList.reduce(
    (sum, item) => sum + item.spent,
    0
  );

  let cumulativePercentage = 0;

  const gradientSegments = categoryList.map((item) => {
    const start = cumulativePercentage;

    cumulativePercentage += total > 0 ? (item.spent / total) * 100 : 0;

    return `${item.hexColor} ${start}% ${cumulativePercentage}%`;
  });

  const donutBackground =
    total > 0
      ? `conic-gradient(${gradientSegments.join(", ")})`
      : "#282331";

  return (
    <section className="panel breakdown-panel">
      <div className="panel-heading">
        <div>
          <h3>Spending breakdown</h3>
          <p>Where your money goes this month</p>
        </div>

        <button
          className="text-button"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("spendwise-navigate", {
                detail: "Budgets",
              })
            )
          }
        >
          View all <ArrowRight size={15} />
        </button>
      </div>

      <div className="donut-layout">
        <div
          className="donut-chart"
          style={{ background: donutBackground }}
          role="img"
          aria-label={`Spending breakdown totaling ${formatCurrency(total)}`}
        >
          <div className="donut-hole">
            <span>Total spent</span>
            <strong>{formatCurrency(total)}</strong>
            <small>This month</small>
          </div>
        </div>
      </div>

      <div className="category-list">
        {categoryList.map((item) => (
          <div className="category-row" key={item.name}>
            <span
              className={`category-indicator ${item.color}`}
              style={{ backgroundColor: item.hexColor }}
            />

            <span className="category-name">{item.name}</span>
            <strong>{formatCurrency(item.spent)}</strong>
          </div>
        ))}

        {categoryList.length === 0 && (
          <p className="empty-row">
            No expenses recorded this month. Add a transaction to see your
            spending breakdown.
          </p>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   TRANSACTION TABLE
========================================================= */

function TransactionTable({ transactions, searchTerm }) {
  const filtered = transactions.filter((item) =>
    matchesTransaction(item, searchTerm)
  );

  return (
    <div className="transaction-table-wrap">
      <table className="transaction-table">
        <thead>
          <tr>
            <th>TRANSACTION</th>
            <th>CATEGORY</th>
            <th>DATE</th>
            <th className="amount-heading">AMOUNT</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((item) => {
            const Icon = getTransactionIcon(item);

            return (
              <tr key={item.id}>
                <td>
                  <div className="transaction-name">
                    <div
                      className={`transaction-icon ${getTransactionColor(item)}`}
                    >
                      <Icon size={17} />
                    </div>

                    <strong>{item.name}</strong>
                  </div>
                </td>

                <td>
                  <span className="transaction-category">
                    {item.category}
                  </span>
                </td>

                <td className="transaction-date">{item.date}</td>

                <td className={`transaction-amount ${item.type}`}>
                  {item.type === "income" ? "+" : "−"}
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            );
          })}

          {filtered.length === 0 && (
            <tr>
              <td colSpan="4" className="empty-row">
                {searchTerm
                  ? "No matching transactions found."
                  : "No transactions yet. Add your first transaction."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Transactions({ transactions, searchTerm, onViewAll }) {
  return (
    <section className="panel transactions-panel">
      <div className="panel-heading">
        <div>
          <h3>Recent transactions</h3>
          <p>Your latest financial activity</p>
        </div>

        <button className="text-button" onClick={onViewAll}>
          View all <ArrowRight size={15} />
        </button>
      </div>

      <TransactionTable
        transactions={transactions.slice(0, 8)}
        searchTerm={searchTerm}
      />
    </section>
  );
}

/* =========================================================
   SAVINGS GOALS
========================================================= */

function SavingsGoals({ goals, onAddGoal }) {
  return (
    <section className="panel goals-panel">
      <div className="panel-heading">
        <div>
          <h3>Savings goals</h3>
          <p>Small steps, meaningful progress</p>
        </div>

        <button
          className="icon-button subtle-add"
          onClick={onAddGoal}
          aria-label="Add savings goal"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="goals-list">
        {goals.map((goal) => {
          const percentage = Math.min(
            100,
            Math.round((goal.saved / goal.target) * 100)
          );

          return (
            <div className="goal-item" key={goal.id}>
              <div className={`goal-icon ${goal.color}`}>
                <Target size={18} />
              </div>

              <div className="goal-content">
                <div className="goal-title-row">
                  <strong>{goal.name}</strong>
                  <span>{percentage}%</span>
                </div>

                <div className="progress-track">
                  <div
                    className={`progress-fill ${goal.color}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="goal-amounts">
                  <span>{formatCurrency(goal.saved)} saved</span>
                  <span>of {formatCurrency(goal.target)}</span>
                </div>
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <p className="empty-row">
            No savings goals yet. Create a goal to start tracking progress.
          </p>
        )}
      </div>

      <button className="goal-footer-button" onClick={onAddGoal}>
        <Plus size={16} /> Create a savings goal
      </button>
    </section>
  );
}

/* =========================================================
   INSIGHTS BANNER
========================================================= */

function InsightsPanel() {
  return (
    <section className="insights-banner">
      <div className="insights-decoration decoration-one" />
      <div className="insights-decoration decoration-two" />

      <div className="insights-icon">
        <Sparkles size={21} />
      </div>

      <div className="insights-copy">
        <span className="insights-label">
          YOUR FINANCIAL COMPANION
        </span>

        <h3>A little insight can go a long way.</h3>

        <p>
          Explore your spending patterns, compare budgets, and discover
          practical ways to work toward your goals.
        </p>
      </div>

      <button
        onClick={() =>
          window.dispatchEvent(
            new CustomEvent("spendwise-navigate", {
              detail: "AI Insights",
            })
          )
        }
      >
        Explore insights <ArrowRight size={16} />
      </button>
    </section>
  );
}

/* =========================================================
   MODAL
========================================================= */

function Modal({ type, onClose, onSave }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food & Groceries");
  const [transactionType, setTransactionType] = useState("expense");
  const [error, setError] = useState("");

  

  useEffect(() => {
    if (!type) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [type, onClose]);

  if (!type) {
    return null;
  }

  const isGoal = type === "goal";

  function handleSubmit(event) {
    event.preventDefault();

    const numericAmount = Number(amount);

    if (!name.trim()) {
      setError("Please enter a name.");
      return;
    }

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError("Please enter an amount greater than zero.");
      return;
    }

    onSave({
      name: name.trim(),
      amount: numericAmount,
      category: isGoal ? "Savings" : category,
      type: isGoal ? "goal" : transactionType,
    });
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              {isGoal ? "PLAN YOUR FUTURE" : "YOUR FINANCES"}
            </span>

            <h2 id="modal-title">
              {isGoal ? "Create a savings goal" : "Add a transaction"}
            </h2>
          </div>

          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            {isGoal ? "Goal name" : "Transaction name"}

            <input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              placeholder={
                isGoal ? "e.g. New laptop" : "e.g. Bus Fare"
              }
              maxLength={80}
              required
              autoFocus
            />
          </label>

          <label>
            {isGoal ? "Target amount (₹)" : "Amount (₹)"}

            <input
              type="number"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setError("");
              }}
              placeholder="Enter amount"
              min="0.01"
              step="0.01"
              required
            />
          </label>

          {isGoal ? (
            <p className="form-hint">
              Your goal starts at ₹0 saved. You can track contributions
              separately as we add more features.
            </p>
          ) : (
            <>
              <label>
                Transaction type

                <select
                  value={transactionType}
                  onChange={(event) => setTransactionType(event.target.value)}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </label>

              <label>
                Category

                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button type="submit" className="primary-button">
              <Check size={16} />
              {isGoal ? "Create goal" : "Save transaction"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

/* =========================================================
   TRANSACTION-BASED INSIGHTS
========================================================= */

function InsightsPage({ transactions, goals, budgets }) {

  const currentMonthTransactions = transactions.filter(
    (item) => isCurrentMonth(item)
  );

  const expenses = currentMonthTransactions.filter(
    (item) => item.type === "expense"
  );

  const income = currentMonthTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);

  const totalExpenses = expenses.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const categoryTotals = expenses.reduce((totals, item) => {
    totals[item.category] =
      (totals[item.category] || 0) + item.amount;

    return totals;
  }, {});

  const highestCategory = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const savingsRate =
    income > 0
      ? Math.round(((income - totalExpenses) / income) * 100)
      : 0;

  const insights = [];

  if (transactions.length === 0) {
    insights.push({
      type: "GETTING STARTED",
      title: "Start recording your activity",
      description:
        "Add your income and expenses to receive observations based on your financial records.",
      color: "purple",
      icon: Lightbulb,
    });
  } else {
    if (income === 0) {
      insights.push({
        type: "INCOME",
        title: "Record your income",
        description:
          "No income has been recorded yet. Adding it will make your balance and savings-rate calculations more meaningful.",
        color: "blue",
        icon: TrendingUp,
      });
    } else {
      insights.push({
        type: "SAVINGS",
        title: `Your calculated savings rate is ${savingsRate}%`,
        description:
          savingsRate >= 20
            ? "Your recorded income exceeds your recorded expenses. Consider allocating part of the difference to your savings goals."
            : savingsRate >= 0
              ? "Your recorded expenses are close to your income. Review your spending categories and choose a realistic savings target."
              : "Your recorded expenses exceed your recorded income. Review your records and look for expenses you can reduce.",
        color: "purple",
        icon: TrendingUp,
      });
    }

    if (highestCategory) {
      insights.push({
        type: "SPENDING",
        title: `${highestCategory[0]} is your largest expense category`,
        description: `You've recorded ${formatCurrency(highestCategory[1])} in this category across your saved transactions.`,
        color: "pink",
        icon: Activity,
      });
    }
  }

  const overBudget = budgets.filter((budget) => {
    const spent = expenses
      .filter(
        (item) =>
          item.category === budget.name &&
          isCurrentMonth(item)
      )
      .reduce((sum, item) => sum + item.amount, 0);

    return spent > budget.limit;
  });

  insights.push({
    type: "SAVINGS GOALS",
    title: `${goals.length} savings goal${goals.length === 1 ? "" : "s"} tracked`,
    description:
      goals.length > 0
        ? `${formatCurrency(
            goals.reduce((sum, goal) => sum + goal.saved, 0)
          )} has been marked as saved toward your goals.`
        : "Create a savings goal to give your plans a clear target.",
    color: "blue",
    icon: Target,
  });

if (overBudget.length > 0) {
  const budgetDetails = overBudget.map((budget) => {
    const spent = expenses
      .filter((item) => item.category === budget.name)
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      name: budget.name,
      spent,
      limit: budget.limit,
      excess: spent - budget.limit,
    };
  });

  insights.push({
    type: "BUDGET ALERT",
    title: `${overBudget.length} budget${
      overBudget.length === 1 ? "" : "s"
    } exceeded`,
    description: budgetDetails
      .map(
        (budget) =>
          `${budget.name}: ${formatCurrency(
            budget.spent
          )} spent against ${formatCurrency(
            budget.limit
          )}, exceeding the limit by ${formatCurrency(
            budget.excess
          )}. Consider reducing non-essential spending in this category.`
      )
      .join(" "),
    color: "orange",
    icon: ShieldCheck,
  });
}


  return (
    <div className="secondary-content">
      <SectionHeading
        eyebrow="FINANCIAL ANALYSIS"
        title="Your financial insights"
        description="These observations are calculated from your saved transactions and goals. They are not generated by a third-party AI model."
      />

      <div className="insights-page-grid">
        {insights.map((insight, index) => {
          const Icon = insight.icon;

          return (
            <article
              className="panel insight-detail-card"
              key={`${insight.type}-${index}`}
            >
              <div className={`metric-icon ${insight.color}`}>
                <Icon size={20} />
              </div>

              <span className="insight-type">{insight.type}</span>
              <h3>{insight.title}</h3>
              <p>{insight.description}</p>
            </article>
          );
        })}
      </div>

      <div className="panel note-panel">
        <Sparkles size={19} />

        <p>
          Summary: {formatCurrency(income)} recorded income and{" "}
          {formatCurrency(totalExpenses)} recorded expenses. These
          calculations reflect your saved records and may not represent
          your complete financial situation.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   MY ACCOUNT
========================================================= */

function MyAccountPage({ transactions, goals, budgets, onExport }) {
  const [profile, setProfile] = useState(() => {
    try {
      const saved = window.localStorage.getItem("spendwise-profile");
      const parsed = saved ? JSON.parse(saved) : {};
      return {
        name: typeof parsed.name === "string" ? parsed.name : "",
        email: typeof parsed.email === "string" ? parsed.email : "",
        location: typeof parsed.location === "string" ? parsed.location : "",
      };
    } catch (error) {
      console.error("Could not read account profile:", error);
      return { name: "", email: "", location: "" };
    }
  });
  const [savedMessage, setSavedMessage] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
    setSavedMessage("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    try {
      window.localStorage.setItem("spendwise-profile", JSON.stringify(profile));
      setSavedMessage("Your account details have been saved in this browser.");
    } catch (error) {
      console.error("Could not save account profile:", error);
      setSavedMessage("Unable to save details. Please check your browser storage.");
    }
  }

  const displayName = profile.name.trim() || "Your account";
  const initial = displayName.charAt(0).toUpperCase() || "S";

  return (
    <div className="secondary-content">
      <SectionHeading
        eyebrow="PERSONAL WORKSPACE"
        title="My Account"
        description="View your SpendWise workspace details and manage your personal profile."
        action={
          <button className="export-button" onClick={onExport} type="button">
            <Download size={16} /> Export transactions
          </button>
        }
      />

      <section className="panel settings-card" style={{ marginBottom: 20 }}>
        <div className="settings-card-heading">
          <div className="avatar" style={{ width: 58, height: 58, fontSize: 22 }}>{initial}</div>
          <div>
            <h3>{displayName}</h3>
            <p>{profile.email.trim() || "Add an email address to your local profile"}</p>
            <span className="settings-badge"><ShieldCheck size={14} /> Personal workspace · Local storage</span>
          </div>
        </div>
      </section>

      <div className="settings-grid">
        <section className="panel settings-card">
          <div className="settings-card-heading">
            <div className="placeholder-icon"><Settings size={22} /></div>
            <div>
              <h3>Personal information</h3>
              <p>These optional details are saved only in this browser.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label>
              Display name
              <input
                name="name"
                value={profile.name}
                onChange={handleChange}
                placeholder="Enter your name"
                maxLength={80}
              />
            </label>

            <label>
              Email address (optional)
              <input
                name="email"
                type="email"
                value={profile.email}
                onChange={handleChange}
                placeholder="you@example.com"
                maxLength={120}
              />
            </label>

            <label>
              Location (optional)
              <input
                name="location"
                value={profile.location}
                onChange={handleChange}
                placeholder="City, country"
                maxLength={100}
              />
            </label>

            <div className="modal-actions" style={{ justifyContent: "flex-start" }}>
              <button type="submit" className="primary-button">
                <Check size={16} /> Save account details
              </button>
            </div>
            {savedMessage && <p className="form-hint" role="status">{savedMessage}</p>}
          </form>
        </section>

        <section className="panel settings-card">
          <div className="settings-card-heading">
            <div className="placeholder-icon"><Wallet size={22} /></div>
            <div>
              <h3>Workspace summary</h3>
              <p>A live summary of the records in this browser.</p>
            </div>
          </div>

          <div className="settings-row">
            <div><strong>Transactions</strong><p>Income and expense entries</p></div>
            <span className="settings-value">{transactions.length}</span>
          </div>
          <div className="settings-row">
            <div><strong>Savings goals</strong><p>Goals you are tracking</p></div>
            <span className="settings-value">{goals.length}</span>
          </div>
          <div className="settings-row">
            <div><strong>Budgets</strong><p>Spending limits you have created</p></div>
            <span className="settings-value">{budgets.length}</span>
          </div>
          <div className="settings-row">
            <div><strong>Currency</strong><p>Used for financial calculations</p></div>
            <span className="settings-value">INR (₹)</span>
          </div>
          <div className="settings-row">
            <div><strong>Storage</strong><p>Saved on this device and browser</p></div>
            <span className="settings-badge"><ShieldCheck size={14} /> Local</span>
          </div>
        </section>
      </div>

      <section className="panel settings-card" style={{ marginTop: 20 }}>
        <div className="settings-information">
          <h4>Privacy note</h4>
          <p>
            SpendWise does not sign you into an online account or sync your records to a server.
            Profile details, transactions, budgets, and savings goals are stored locally in this
            browser. They may not be available in another browser or device, and clearing site
            storage may remove them. Do not enter passwords, bank login details, or other sensitive
            information here.
          </p>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   SECONDARY PAGES
========================================================= */

function SecondaryPage({
  page,
  transactions,
  goals,
  budgets,
  onAddTransaction,
  onAddGoal,
  onAddBudget,
  onEditBudget,
  onDeleteBudget,
  onDeleteTransaction,
  onDeleteGoal,
  onExport,
}) {
  const [query, setQuery] = useState("");

  
  if (page === "My Account") {
    return (
      <MyAccountPage
        transactions={transactions}
        goals={goals}
        budgets={budgets}
        onExport={onExport}
      />
    );
  }

  if (page === "Transactions") {
    return (
      <div className="secondary-content">
        <SectionHeading
          eyebrow="YOUR ACTIVITY"
          title="Transactions"
          description="Review the money coming in and going out."
          action={
            <button
              className="primary-button"
              onClick={onAddTransaction}
            >
              <Plus size={16} /> Add transaction
            </button>
          }
        />

        <div className="panel secondary-panel">
          <div className="secondary-search">
            <Search size={17} />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter transactions..."
              aria-label="Filter transactions"
            />
          </div>

          <TransactionTable
            transactions={transactions}
            searchTerm={query}
          />

          {transactions.length > 0 && (
            <p className="form-hint">
              {transactions.length} transaction
              {transactions.length === 1 ? "" : "s"} recorded.
            </p>
          )}

          <div className="secondary-action-row">
            <button
              className="cancel-button"
              onClick={onDeleteTransaction}
              disabled={transactions.length === 0}
            >
              Delete a transaction
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (page === "Budgets") {
    return (
      <div className="secondary-content">
        <SectionHeading
          eyebrow="SPENDING PLAN"
          title="Your budgets"
          description="Set spending limits and track your monthly expenses."
          action={
            <button className="primary-button" onClick={onAddBudget}>
              <Plus size={16} /> Add budget
            </button>
          }
        />

        <div className="budget-grid">
          {budgets.map((item) => {
            const spent = transactions
              .filter(
                (transaction) =>
                  transaction.type === "expense" &&
                  transaction.category === item.name &&
                  isCurrentMonth(transaction)
              )
              .reduce(
                (sum, transaction) => sum + transaction.amount,
                0
              );

            const percentage =
  item.limit > 0
    ? Math.round((spent / item.limit) * 100)
    : 0;


const exceeded = spent > item.limit;



            return (
              <article className="panel budget-card" key={item.id}>
                <div className={`metric-icon ${item.color}`}>
                  <Wallet size={20} />
                </div>

                <h3>{item.name}</h3>

                <div className="budget-numbers">
                  <strong>{formatCurrency(spent)}</strong>
                  <span>of {formatCurrency(item.limit)}</span>
                </div>

                <div className="progress-track">
                  <div
                    className={`progress-fill ${item.color}`}
                    style={{
                      width: `${Math.min(100, percentage)}%`,
                    }}
                  />
                </div>

                <p className="budget-remaining">
                  {exceeded
                    ? `${formatCurrency(spent - item.limit)} over budget`
                    : `${formatCurrency(item.limit - spent)} remaining`}
                  {" "}· {percentage}% used
                </p>

                <div className="budget-actions">
                  <button
                    className="text-button"
                    onClick={() => onEditBudget(item)}
                  >
                    Edit limit
                  </button>

                  <button
                    className="text-button"
                    onClick={() => onDeleteBudget(item)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}

          {budgets.length === 0 && (
            <div className="panel note-panel">
              <Lightbulb size={19} />
              <p>
                No budgets created yet. Add a budget to set your first
                spending limit.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (page === "Savings Goals") {
    return (
      <div className="secondary-content">
        <SectionHeading
          eyebrow="YOUR FUTURE"
          title="Savings goals"
          description="Make progress toward the things that matter to you."
          action={
            <button className="primary-button" onClick={onAddGoal}>
              <Plus size={16} /> New goal
            </button>
          }
        />

        <div className="goals-page-grid">
          {goals.map((goal) => {
            const percentage = Math.min(
              100,
              Math.round((goal.saved / goal.target) * 100)
            );

            return (
              <article className="panel large-goal-card" key={goal.id}>
                <div className={`goal-icon ${goal.color}`}>
                  <Target size={22} />
                </div>

                <span className="goal-status">
                  <span /> {percentage >= 100 ? "Completed" : "In progress"}
                </span>

                <h3>{goal.name}</h3>

                <p>
                  Keep moving toward your savings target, one step at a time.
                </p>

                <div className="large-goal-amount">
                  <strong>{formatCurrency(goal.saved)}</strong>
                  <span>of {formatCurrency(goal.target)}</span>
                </div>

                <div className="progress-track">
                  <div
                    className={`progress-fill ${goal.color}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="goal-title-row">
                  <span className="muted-text">Goal progress</span>
                  <strong>{percentage}%</strong>
                </div>

                <button
                  className="text-button"
                  onClick={() => onDeleteGoal(goal)}
                >
                  Delete goal
                </button>
              </article>
            );
          })}

          {goals.length === 0 && (
            <div className="panel note-panel">
              <Target size={19} />
              <p>
                No savings goals yet. Create one to start tracking your
                savings target.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (page === "AI Insights") {
    return (
      <InsightsPage
        transactions={transactions}
        goals={goals}
        budgets={budgets}
      />
    );
  }

  if (page === "Settings") {
    return (
      <div className="secondary-content">
        <SectionHeading
          eyebrow="PREFERENCES"
          title="Settings"
          description="Manage your preferences and personal finance workspace."
        />

        <div className="settings-grid">
          <section className="panel settings-card">
            <div className="settings-card-heading">
              <div className="placeholder-icon">
                <Wallet size={22} />
              </div>
              <div>
                <h3>Workspace preferences</h3>
                <p>Personalize your SpendWise experience.</p>
              </div>
            </div>

            <div className="settings-row">
              <div>
                <strong>Currency</strong>
                <p>Currency used for financial calculations.</p>
              </div>
              <span className="settings-value">INR (₹)</span>
            </div>

            <div className="settings-row">
              <div>
                <strong>Data storage</strong>
                <p>Your records remain in this browser.</p>
              </div>
              <span className="settings-badge">
                <ShieldCheck size={14} /> Local
              </span>
            </div>
          </section>

          <section className="panel settings-card">
            <div className="settings-card-heading">
              <div className="placeholder-icon">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3>Privacy & data</h3>
                <p>Understand how your financial information is handled.</p>
              </div>
            </div>

            <div className="settings-information">
              <h4>Your data, your browser</h4>
              <p>
                SpendWise stores your transactions, budgets, and savings
                goals in your browser's local storage. This version does
                not connect to your bank account or synchronize records
                across devices.
              </p>
            </div>

            <div className="settings-information">
              <h4>Before clearing browser data</h4>
              <p>
                Clearing this site's local storage may permanently remove
                your saved financial records. Export or back up important
                information before clearing browser data.
              </p>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="secondary-content">
      <SectionHeading
        eyebrow="SPENDWISE AI"
        title="Help & Support"
        description="Everything you need to manage your money with confidence."
      />

      <div className="help-welcome panel">
        <div className="help-welcome-icon">
          <CircleHelp size={28} />
        </div>
        <div>
          <span className="eyebrow">SPENDWISE GUIDE</span>
          <h2>Let's make money management simpler.</h2>
          <p>
            Explore your workspace, understand your finances, and
            build better spending habits one step at a time.
          </p>
        </div>
      </div>

      <div className="help-grid">
        <article className="panel help-card">
          <div className="help-card-icon purple">
            <Wallet size={21} />
          </div>
          <h3>Getting started</h3>
          <p>
            Your Overview dashboard summarizes your income, expenses,
            net balance, and savings rate. Use it to understand your
            current financial position.
          </p>
        </article>

        <article className="panel help-card">
          <div className="help-card-icon green">
            <ArrowDownLeft size={21} />
          </div>
          <h3>Managing transactions</h3>
          <p>
            Add each income or expense with its amount, category, and
            date. Your recorded transactions update your financial
            calculations automatically.
          </p>
        </article>

        <article className="panel help-card">
          <div className="help-card-icon orange">
            <TrendingUp size={21} />
          </div>
          <h3>Understanding budgets</h3>
          <p>
            Create category-based spending limits. Review how much
            you have spent, how much remains, and whether you are
            approaching or exceeding a limit.
          </p>
        </article>

        <article className="panel help-card">
          <div className="help-card-icon blue">
            <Target size={21} />
          </div>
          <h3>Reaching savings goals</h3>
          <p>
            Create targets for things that matter to you. Track the
            amount saved against each target and review your progress
            as you work toward it.
          </p>
        </article>

        <article className="panel help-card">
          <div className="help-card-icon purple">
            <Sparkles size={21} />
          </div>
          <h3>AI Insights</h3>
          <p>
            Review the spending patterns and financial observations
            calculated from your recorded data. Treat these insights
            as guidance, not guaranteed financial advice.
          </p>
        </article>

        <article className="panel help-card">
          <div className="help-card-icon green">
            <ShieldCheck size={21} />
          </div>
          <h3>Privacy and security</h3>
          <p>
            Your current workspace stores records in your browser.
            This version does not connect to your bank or automatically
            synchronize your data across devices.
          </p>
        </article>
      </div>

      <section className="panel help-troubleshooting">
        <div className="help-troubleshooting-heading">
          <div className="help-card-icon orange">
            <Lightbulb size={21} />
          </div>
          <div>
            <h3>Quick troubleshooting</h3>
            <p>Simple checks for common issues.</p>
          </div>
        </div>

        <div className="help-tip">
          <strong>My balance looks incorrect.</strong>
          <p>
            Check your recorded transactions and confirm that each
            entry has the correct amount and transaction type.
          </p>
        </div>

        <div className="help-tip">
          <strong>My budget shows that I am over the limit.</strong>
          <p>
            Review the expenses assigned to that category. Spending
            can exceed a budget even when the budget itself is valid.
          </p>
        </div>

        <div className="help-tip">
          <strong>My data is missing.</strong>
          <p>
            Check whether you are using the same browser and browser
            profile. Clearing site data or using a different browser
            can make locally stored records unavailable.
          </p>
        </div>

        <div className="help-tip">
          <strong>A button or feature is not responding.</strong>
          <p>
            Refresh the page and try again. If the issue continues,
            check the browser console for errors.
          </p>
        </div>
      </section>

      <div className="help-footer-note">
        <ShieldCheck size={17} />
        <p>
          SpendWise helps you organize financial information.
          Always verify important financial decisions independently.
        </p>
      </div>
    </div>
  );
}


/* =========================================================
   APP
========================================================= */

function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [transactions, setTransactions] = useState(() =>
    readStoredData(
      STORAGE_KEYS.transactions,
      initialTransactions,
      isValidTransactionList
    ).map((transaction) => ({
      ...transaction,
      color: getTransactionColor(transaction),
    }))
  );

  const [goals, setGoals] = useState(() =>
    readStoredData(
      STORAGE_KEYS.goals,
      initialGoals,
      isValidGoalList
    )
  );

  const [budgets, setBudgets] = useState(() =>
    readStoredData(
      STORAGE_KEYS.budgets,
      initialBudgets,
      isValidBudgetList
    )
  );

  const [toast, setToast] = useState("");
  const [budgetEditing, setBudgetEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const toastTimer = useRef(null);

  const showToast = useCallback((message) => {
    setToast(message);

    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }

    toastTimer.current = window.setTimeout(() => {
      setToast("");
      toastTimer.current = null;
    }, 2800);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.transactions,
        JSON.stringify(transactions)
      );
    } catch (error) {
      console.error("Could not save transactions:", error);
    }
  }, [transactions, showToast]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.goals,
        JSON.stringify(goals)
      );
    } catch (error) {
      console.error("Could not save savings goals:", error);
    }
  }, [goals, showToast]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.budgets,
        JSON.stringify(budgets)
      );
    } catch (error) {
      console.error("Could not save budgets:", error);
    }
  }, [budgets, showToast]);

  useEffect(() => {
    function handleNavigate(event) {
      const page = event.detail;

      if (
        [
          "Overview",
          "Transactions",
          "Budgets",
          "Savings Goals",
          "AI Insights",
          "My Account",
          "Settings",
          "Help & Support",
        ].includes(page)
      ) {
        setActivePage(page);
      }
    }

    function handleShortcut(event) {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();

        const input = document.querySelector(
          '.search-box input[aria-label="Search transactions"]'
        );

        input?.focus();
      }
    }

    window.addEventListener("spendwise-navigate", handleNavigate);
    window.addEventListener("keydown", handleShortcut);

    return () => {
      window.removeEventListener("spendwise-navigate", handleNavigate);
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const income = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);

  const expenses = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);

  const balance = income - expenses;

  const savingsRate =
    income > 0 ? Math.round((balance / income) * 100) : 0;

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((item) =>
        matchesTransaction(item, searchTerm)
      ),
    [transactions, searchTerm]
  );

  function handleSave(data) {
    if (modalType === "goal") {
      setGoals((current) => [
        ...current,
        {
          id: Date.now(),
          name: data.name,
          saved: 0,
          target: data.amount,
          color: goalColors[current.length % goalColors.length],
        },
      ]);

      setModalType(null);
      showToast("Savings goal created.");
      return;
    }

    const transaction = {
      id: Date.now(),
      name: data.name,
      category: data.category,
      date: formatDate(),
      amount: data.amount,
      type: data.type,
      color: categoryColors[data.category] || "purple",
    };

    setTransactions((current) => [transaction, ...current]);

    setModalType(null);
    showToast("Transaction saved successfully.");
  }

  function handleExport() {
    if (transactions.length === 0) {
      showToast("There are no transactions to export.");
      return;
    }

    const headers = ["Name", "Category", "Date", "Type", "Amount"];

    const rows = transactions.map((item) =>
      [
        item.name,
        item.category,
        item.date,
        item.type,
        item.amount,
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "spendwise-transactions.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    showToast("Transaction report exported.");
  }

  function handleAddBudget(data) {
    if (budgetEditing) {
      setBudgets((current) =>
        current.map((item) =>
          item.id === budgetEditing.id
            ? {
                ...item,
                name: data.name,
                limit: data.amount,
                color: categoryColors[data.name] || item.color,
              }
            : item
        )
      );

      setBudgetEditing(null);
      showToast("Budget updated.");
      return;
    }

    if (budgets.some((item) => item.name === data.name)) {
      showToast("A budget already exists for that category.");
      return;
    }

    setBudgets((current) => [
      ...current,
      {
        id: Date.now(),
        name: data.name,
        limit: data.amount,
        color: categoryColors[data.name] || "purple",
      },
    ]);

    showToast("Budget created.");
  }

  function handleDeleteBudget(budget) {
    if (
      window.confirm(
        `Delete the budget for "${budget.name}"? Your transactions will remain unchanged.`
      )
    ) {
      setBudgets((current) =>
        current.filter((item) => item.id !== budget.id)
      );

      showToast("Budget deleted.");
    }
  }

  function handleDeleteGoal(goal) {
    if (
      window.confirm(
        `Delete the savings goal "${goal.name}"?`
      )
    ) {
      setGoals((current) =>
        current.filter((item) => item.id !== goal.id)
      );

      showToast("Savings goal deleted.");
    }
  }

  function handleDeleteTransaction() {
    if (transactions.length === 0) {
      showToast("There are no transactions to delete.");
      return;
    }

    setDeleteTarget({
      type: "transaction",
      items: transactions,
    });
  }

  function confirmDeleteTransaction(transaction) {
    setTransactions((current) =>
      current.filter((item) => item.id !== transaction.id)
    );

    setDeleteTarget(null);
    showToast("Transaction deleted.");
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="main-area">
        <Header
          activePage={activePage}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onMenuClick={() => setSidebarOpen(true)}
          onAddTransaction={() => setModalType("transaction")}
          onNotifications={() =>
            showToast(
              "You're all caught up. Notifications will appear here when available."
            )
          }
        />

        {activePage === "Overview" ? (
          <div className="dashboard-content">
            <section className="welcome-section">
              <div>
                <div className="welcome-date">
                  <span className="status-dot" />
                  YOUR FINANCIAL OVERVIEW
                </div>

                <h1>
                  Your money, <span>in perspective.</span>
                </h1>

                <p>
                  A clearer picture of your finances starts here. Let's
                  make every rupee count.
                </p>
              </div>

              <button
                className="export-button"
                onClick={handleExport}
              >
                <Download size={16} /> Export report
              </button>
            </section>

            <div className="demo-notice">
              <span className="demo-notice-dot" />
              <span>LOCAL DATA</span>
              <span>
                This workspace stores records in your current browser.
              </span>
            </div>

            <section className="metrics-grid">
              <MetricCard
                title="Net balance"
                value={formatCurrency(balance)}
                change="Live calculation"
                icon={Wallet}
                color="purple"
                positive={balance >= 0}
                note="Income minus recorded expenses"
              />

              <MetricCard
                title="Total income"
                value={formatCurrency(income)}
                change={`${
                  transactions.filter((item) => item.type === "income")
                    .length
                } entries`}
                icon={ArrowDownLeft}
                color="green"
                positive
                note="Based on recorded income"
              />

              <MetricCard
                title="Total expenses"
                value={formatCurrency(expenses)}
                change={`${
                  transactions.filter((item) => item.type === "expense")
                    .length
                } entries`}
                icon={ArrowUpRight}
                color="orange"
                positive={false}
                note="Based on recorded expenses"
              />

              <MetricCard
                title="Savings rate"
                value={`${savingsRate}%`}
                change="Calculated"
                icon={TrendingUp}
                color="blue"
                positive={savingsRate >= 0}
                note="Net balance ÷ total income"
              />
            </section>

            <div className="analytics-grid">
              <CashflowChart transactions={transactions} />

              <SpendingBreakdown transactions={transactions} />
            </div>

            <div className="lower-grid">
              <Transactions
                transactions={filteredTransactions}
                searchTerm={searchTerm}
                onViewAll={() => setActivePage("Transactions")}
              />

              <SavingsGoals
                goals={goals}
                onAddGoal={() => setModalType("goal")}
              />
            </div>

            <InsightsPanel />

            <footer className="app-footer">
              <span>© 2026 SpendWise AI</span>

              <span>
                <ShieldCheck size={14} /> Designed with privacy in mind
              </span>

              <span>Small steps. Smarter money.</span>
            </footer>
          </div>
        ) : (
          <SecondaryPage
  key={activePage}
  page={activePage}
  transactions={transactions}
            goals={goals}
            budgets={budgets}
            onAddTransaction={() => setModalType("transaction")}
            onAddGoal={() => setModalType("goal")}
            onAddBudget={() => {
              setBudgetEditing(null);
              setModalType("budget");
            }}
            onEditBudget={(budget) => {
              setBudgetEditing(budget);
              setModalType("budget");
            }}
            onDeleteBudget={handleDeleteBudget}
            onDeleteTransaction={handleDeleteTransaction}
            onDeleteGoal={handleDeleteGoal}
            onExport={handleExport}
          />
        )}
      </main>

      <Modal
  key={modalType === "budget" ? "closed" : modalType || "closed"}
  type={modalType === "budget" ? null : modalType}
  onClose={() => setModalType(null)}
  onSave={handleSave}
/>

      {modalType === "budget" && (
        <BudgetModal
          budget={budgetEditing}
          existingBudgets={budgets}
          onClose={() => {
            setModalType(null);
            setBudgetEditing(null);
          }}
          onSave={(data) => {
            handleAddBudget(data);
            setModalType(null);
          }}
        />
      )}

      {deleteTarget?.type === "transaction" && (
        <DeleteTransactionModal
          transactions={transactions}
          onClose={() => setDeleteTarget(null)}
          onDelete={confirmDeleteTransaction}
        />
      )}

      {toast && (
        <div className="toast-message" role="status" aria-live="polite">
          <Check size={17} /> {toast}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   BUDGET MODAL
========================================================= */

function BudgetModal({ budget, existingBudgets, onClose, onSave }) {
  const [name, setName] = useState(budget?.name || "Food & Groceries");
  const [amount, setAmount] = useState(
    budget ? String(budget.limit) : ""
  );
  const [error, setError] = useState("");

  const availableCategories = categories.filter(
    (category) =>
      category !== "Income" &&
      (
        category === budget?.name ||
        !existingBudgets.some((item) => item.name === category)
      )
  );

  function handleSubmit(event) {
    event.preventDefault();

    const numericAmount = Number(amount);

    if (!name) {
      setError("Please choose a category.");
      return;
    }

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError("Enter a budget limit greater than zero.");
      return;
    }

    onSave({ name, amount: numericAmount });
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="budget-modal-title"
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">SPENDING PLAN</span>
            <h2 id="budget-modal-title">
              {budget ? "Edit budget" : "Create a budget"}
            </h2>
          </div>

          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close budget dialog"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Category

            <select
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
            >
              {availableCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            Monthly budget limit (₹)

            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setError("");
              }}
              placeholder="Enter your limit"
              required
            />
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button type="submit" className="primary-button">
              <Check size={16} />
              {budget ? "Save changes" : "Create budget"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

/* =========================================================
   DELETE TRANSACTION MODAL
========================================================= */

function DeleteTransactionModal({ transactions, onClose, onDelete }) {
  const [selectedId, setSelectedId] = useState(
    transactions[0]?.id ?? ""
  );

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-transaction-title"
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">MANAGE RECORDS</span>
            <h2 id="delete-transaction-title">Delete a transaction</h2>
          </div>

          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <label>
          Choose transaction

          <select
            value={selectedId}
            onChange={(event) => setSelectedId(Number(event.target.value))}
          >
            {transactions.map((transaction) => (
              <option
                key={transaction.id}
                value={transaction.id}
              >
                {transaction.name} — {formatCurrency(transaction.amount)}
              </option>
            ))}
          </select>
        </label>

        <p className="form-hint">
          Deleting a transaction changes your balance and related
          spending calculations. This action cannot be undone.
        </p>

        <div className="modal-actions">
          <button
            className="cancel-button"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="primary-button"
            disabled={selectedId === ""}
            onClick={() => {
              const transaction = transactions.find(
                (item) => item.id === selectedId
              );

              if (transaction) {
                const confirmed = window.confirm(
                  `Permanently delete "${transaction.name}"?`
                );

                if (confirmed) {
                  onDelete(transaction);
                }
              }
            }}
          >
            Delete transaction
          </button>
        </div>
      </section>
    </div>
  );
}

export default App;