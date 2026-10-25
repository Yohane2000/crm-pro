```tsx
"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Target,
  CalendarDays,
  CheckSquare,
  ChartNoAxesCombined,
  Settings,
  Search,
  Bell,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Menu,
  X,
  ChevronDown,
  Clock3,
  CircleDollarSign,
  UserRoundPlus,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Command,
} from "lucide-react";

const navigation = [
  {
    title: "ESPACE DE TRAVAIL",
    items: [
      { label: "Vue d'ensemble", icon: LayoutDashboard },
      { label: "Clients", icon: Users },
      { label: "Prospects", icon: Target },
    ],
  },
  {
    title: "ORGANISATION",
    items: [
      { label: "Rendez-vous", icon: CalendarDays },
      { label: "Tâches", icon: CheckSquare },
      { label: "Rapports", icon: ChartNoAxesCombined },
    ],
  },
];

const initialClients = [
  {
    name: "Sophie Martin",
    company: "Nova Digital",
    email: "sophie@novadigital.fr",
    amount: "2 450 000",
    status: "Client actif",
    initials: "SM",
    color: "lavender",
  },
  {
    name: "Thomas Bernard",
    company: "Atlas Consulting",
    email: "thomas@atlas.fr",
    amount: "1 850 000",
    status: "En négociation",
    initials: "TB",
    color: "blue",
  },
  {
    name: "Camille Laurent",
    company: "Studio Créatif",
    email: "camille@studio.fr",
    amount: "950 000",
    status: "Client actif",
    initials: "CL",
    color: "peach",
  },
  {
    name: "Lucas Moreau",
    company: "Tech Solutions",
    email: "lucas@techsolutions.fr",
    amount: "3 200 000",
    status: "Nouveau",
    initials: "LM",
    color: "mint",
  },
];

const activities = [
  {
    initials: "SM",
    color: "lavender",
    title: "Nouveau contrat signé",
    detail: "Sophie Martin · Nova Digital",
    time: "Il y a 12 min",
  },
  {
    initials: "TB",
    color: "blue",
    title: "Appel commercial terminé",
    detail: "Thomas Bernard · Atlas Consulting",
    time: "Il y a 45 min",
  },
  {
    initials: "CL",
    color: "peach",
    title: "Nouveau prospect ajouté",
    detail: "Camille Laurent · Studio Créatif",
    time: "Il y a 2 h",
  },
];

const chartValues = [35, 48, 41, 64, 53, 72, 60, 82, 68, 91, 76, 100];

const chartLabels = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

function StatCard({
  title,
  value,
  change,
  positive,
  icon: Icon,
  iconClass,
  index,
}: {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ElementType;
  iconClass: string;
  index: number;
}) {
  return (
    <div
      className={`stat-card animate-in delay-${index}`}
    >
      <div className="stat-top">
        <div className="stat-icon">
          <Icon size={20} className={iconClass} strokeWidth={1.8} />
        </div>
        <button
          className="icon-button subtle-button"
          aria-label={`Options : ${title}`}
        >
          <MoreHorizontal size={19} />
        </button>
      </div>

      <p className="stat-title">{title}</p>

      <div className="stat-value-row">
        <h3>{value}</h3>
        <span className={`change-badge ${positive ? "positive" : "negative"}`}>
          {positive ? (
            <ArrowUpRight size={14} />
          ) : (
            <ArrowDownRight size={14} />
          )}
          {change}
        </span>
      </div>

      <p className="stat-caption">vs. mois précédent</p>
    </div>
  );
}

function RevenueChart() {
  const [period, setPeriod] = useState("Cette année");
  const [hovered, setHovered] = useState<number | null>(null);

  const points = chartValues
    .map((value, index) => {
      const x = 12 + index * (676 / 11);
      const y = 170 - value * 1.35;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `12,180 ${points} 688,180`;

  return (
    <section className="panel revenue-panel animate-in delay-2">
      <div className="panel-header">
        <div>
          <div className="panel-title-row">
            <h2>Revenus</h2>
            <span className="live-indicator">
              <span />
              Données de démonstration
            </span>
          </div>
          <p className="panel-description">
            Évolution de votre chiffre d'affaires
          </p>
        </div>

        <button
          className="select-button"
          onClick={() =>
            setPeriod((previous) =>
              previous === "Cette année" ? "Cette période" : "Cette année"
            )
          }
        >
          {period}
          <ChevronDown size={15} />
        </button>
      </div>

      <div className="revenue-summary">
        <h3>24 850 000 <span>FCFA</span></h3>
        <span className="summary-growth">
          <TrendingUp size={15} />
          +18,6 %
        </span>
      </div>

      <div className="chart-container">
        <div className="chart-y-labels">
          <span>30 M</span>
          <span>20 M</span>
          <span>10 M</span>
          <span>0</span>
        </div>

        <div className="chart-main">
          <svg
            viewBox="0 0 700 190"
            preserveAspectRatio="none"
            className="revenue-chart"
            role="img"
            aria-label="Graphique illustratif de l'évolution annuelle des revenus"
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6C63FF" stopOpacity="0.23" />
                <stop offset="100%" stopColor="#6C63FF" stopOpacity="0" />
              </linearGradient>
            </defs>

            {[20, 65, 110, 155].map((y) => (
              <line
                key={y}
                x1="12"
                y1={y}
                x2="688"
                y2={y}
                stroke="#EEEFF5"
                strokeDasharray="4 5"
              />
            ))}

            <polygon points={areaPoints} fill="url(#revenueGradient)" />

            <polyline
              points={points}
              fill="none"
              stroke="#7167F8"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />

            {chartValues.map((value, index) => {
              const x = 12 + index * (676 / 11);
              const y = 170 - value * 1.35;

              return (
                <g key={chartLabels[index]}>
                  {hovered === index && (
                    <line
                      x1={x}
                      y1={y}
                      x2={x}
                      y2="180"
                      stroke="#B9B4FF"
                      strokeDasharray="3 4"
                    />
                  )}

                  <circle
                    cx={x}
                    cy={y}
                    r={hovered === index ? 5 : 3}
                    fill="#FFFFFF"
                    stroke="#7167F8"
                    strokeWidth="2"
                    onMouseEnter={() => setHovered(index)}
                    onMouseLeave={() => setHovered(null)}
                  />
                </g>
              );
            })}
          </svg>

          {hovered !== null && (
            <div className="chart-tooltip">
              <strong>{chartLabels[hovered]}</strong>
              <span>
                {(chartValues[hovered] * 248500).toLocaleString("fr-FR")} FCFA
              </span>
            </div>
          )}

          <div className="chart-x-labels">
            {chartLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PipelinePanel() {
  const stages = [
    { label: "Nouveaux", count: 24, width: "100%", color: "#8B83FF" },
    { label: "Qualifiés", count: 18, width: "75%", color: "#6C63FF" },
    { label: "Proposition", count: 12, width: "50%", color: "#A78BFA" },
    { label: "Négociation", count: 8, width: "33%", color: "#F0A66A" },
  ];

  return (
    <section className="panel pipeline-panel animate-in delay-3">
      <div className="panel-header">
        <div>
          <h2>Pipeline commercial</h2>
          <p className="panel-description">
            Suivez vos opportunités
          </p>
        </div>

        <button className="icon-button" aria-label="Options du pipeline">
          <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="pipeline-total">
        <div>
          <span className="pipeline-total-label">Opportunités ouvertes</span>
          <h3>62</h3>
        </div>
        <div className="pipeline-icon">
          <Target size={21} />
        </div>
      </div>

      <div className="pipeline-stages">
        {stages.map((stage) => (
          <div className="pipeline-stage" key={stage.label}>
            <div className="stage-label-row">
              <span>{stage.label}</span>
              <strong>{stage.count}</strong>
            </div>

            <div className="stage-track">
              <div
                className="stage-progress"
                style={{
                  width: stage.width,
                  backgroundColor: stage.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <button className="text-link">
        Voir les prospects
        <ArrowRight size={15} />
      </button>
    </section>
  );
}

function ClientsTable() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Tous");

  const filteredClients = initialClients.filter((client) => {
    const matchesQuery =
      `${client.name} ${client.company} ${client.email}`
        .toLowerCase()
        .includes(query.toLowerCase());

    const matchesStatus =
      status === "Tous" ||
      (status === "Actifs" && client.status === "Client actif") ||
      (status === "Négociation" && client.status === "En négociation");

    return matchesQuery && matchesStatus;
  });

  return (
    <section className="panel clients-panel animate-in delay-2">
      <div className="panel-header clients-header">
        <div>
          <h2>Clients récents</h2>
          <p className="panel-description">
            Retrouvez les dernières relations commerciales
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() => {
            setQuery("");
            setStatus("Tous");
          }}
        >
          Voir tous les clients
          <ArrowRight size={15} />
        </button>
      </div>

      <div className="table-toolbar">
        <div className="table-search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Rechercher un client..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Rechercher un client"
          />
        </div>

        <select
          className="filter-select"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filtrer les clients par statut"
        >
          <option value="Tous">Tous les statuts</option>
          <option value="Actifs">Clients actifs</option>
          <option value="Négociation">En négociation</option>
        </select>
      </div>

      <div className="table-scroll">
        <table className="clients-table">
          <thead>
            <tr>
              <th>CLIENT</th>
              <th>ENTREPRISE</th>
              <th>VALEUR</th>
              <th>STATUT</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {filteredClients.map((client) => (
              <tr key={client.email}>
                <td>
                  <div className="client-identity">
                    <div className={`avatar avatar-${client.color}`}>
                      {client.initials}
                    </div>
                    <div className="client-details">
                      <strong>{client.name}</strong>
                      <span>{client.email}</span>
                    </div>
                  </div>
                </td>

                <td className="company-cell">{client.company}</td>

                <td className="amount-cell">{client.amount} FCFA</td>

                <td>
                  <span
                    className={`status-pill ${
                      client.status === "Client actif"
                        ? "status-active"
                        : client.status === "En négociation"
                          ? "status-pending"
                          : "status-new"
                    }`}
                  >
                    <span />
                    {client.status}
                  </span>
                </td>

                <td>
                  <button
                    className="icon-button"
                    aria-label={`Options pour ${client.name}`}
                  >
                    <MoreHorizontal size={19} />
                  </button>
                </td>
              </tr>
            ))}

            {filteredClients.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-table">
                  Aucun client ne correspond à votre recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span>{filteredClients.length} clients affichés</span>
        <span>Exemples de données fictives</span>
      </div>
    </section>
  );
}

function ActivityPanel() {
  return (
    <section className="panel activity-panel animate-in delay-3">
      <div className="panel-header">
        <div>
          <h2>Activité récente</h2>
          <p className="panel-description">Les dernières mises à jour</p>
        </div>

        <button className="icon-button" aria-label="Options des activités">
          <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="activity-list">
        {activities.map((activity, index) => (
          <div className="activity-item" key={activity.title}>
            <div className={`avatar avatar-${activity.color}`}>
              {activity.initials}
            </div>

            <div className="activity-content">
              <strong>{activity.title}</strong>
              <span>{activity.detail}</span>
              <small>
                <Clock3 size={12} />
                {activity.time}
              </small>
            </div>

            {index === 0 && <span className="activity-dot" />}
          </div>
        ))}
      </div>

      <button className="text-link activity-link">
        Consulter l'activité
        <ArrowRight size={15} />
      </button>
    </section>
  );
}

export default function DashboardPage() {
  const [activePage, setActivePage] = useState("Vue d'ensemble");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);

  return (
    <main className="app-shell">
      {mobileMenuOpen && (
        <button
          className="mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Fermer le menu"
        />
      )}

      <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-symbol">
            <Command size={22} strokeWidth={2.5} />
          </div>

          <div className="brand-copy">
            <strong>orbit<span>crm</span></strong>
            <small>BUSINESS WORKSPACE</small>
          </div>

          <button
            className="mobile-close icon-button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        </div>

        <button className="workspace-switcher">
          <div className="workspace-avatar">O</div>
          <div className="workspace-copy">
            <strong>Orbit Studio</strong>
            <span>Espace professionnel</span>
          </div>
          <ChevronDown size={16} />
        </button>

        <div className="sidebar-navigation">
          {navigation.map((group) => (
            <div className="nav-group" key={group.title}>
              <p className="nav-group-title">{group.title}</p>

              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activePage === item.label;

                return (
                  <button
                    key={item.label}
                    className={`nav-item ${active ? "nav-item-active" : ""}`}
                    onClick={() => {
                      setActivePage(item.label);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Icon size={19} strokeWidth={1.8} />
                    <span>{item.label}</span>

                    {item.label === "Tâches" && (
                      <span className="nav-count">8</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon">
              <Sparkles size={19} />
            </div>
            <strong>Travaillez plus intelligemment</strong>
            <p>Centralisez vos activités et gagnez en efficacité.</p>
            <button
              onClick={() =>
                window.alert("Les fonctionnalités avancées arriveront bientôt.")
              }
            >
              Découvrir les fonctionnalités
              <ArrowRight size={14} />
            </button>
          </div>

          <button
            className={`nav-item ${activePage === "Paramètres" ? "nav-item-active" : ""}`}
            onClick={() => setActivePage("Paramètres")}
          >
            <Settings size={19} strokeWidth={1.8} />
            <span>Paramètres</span>
          </button>

          <div className="sidebar-footer">
            <div className="profile-avatar">YW</div>
            <div className="profile-details">
              <strong>Yohane W.</strong>
              <span>Administrateur</span>
            </div>
            <button
              className="icon-button sidebar-profile-menu"
              onClick={() => setShowProfile(!showProfile)}
              aria-label="Ouvrir le menu du profil"
            >
              <MoreHorizontal size={19} />
            </button>
            {showProfile && (
              <div className="profile-popover">
                <strong>Yohane W.</strong>
                <span>Administrateur de démonstration</span>
                <button
                  onClick={() => {
                    setActivePage("Paramètres");
                    setShowProfile(false);
                  }}
                >
                  <Settings size={15} />
                  Paramètres
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-button icon-button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu size={22} />
            </button>

            <div className="breadcrumb">
              <span>Espace de travail</span>
              <span className="breadcrumb-separator">/</span>
              <strong>{activePage}</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="global-search">
              <Search size={17} />
              <input placeholder="Rechercher..." aria-label="Recherche globale" />
              <kbd>⌘ K</kbd>
            </div>

            <div className="notification-wrapper">
              <button
                className="topbar-icon"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
              >
                <Bell size={19} />
                <span className="notification-indicator" />
              </button>

              {showNotifications && (
                <div className="notification-popover">
                  <div className="popover-heading">
                    <strong>Notifications</strong>
                    <span>2 nouvelles</span>
                  </div>
                  <div className="notification-item">
                    <div className="notification-symbol">
                      <CalendarDays size={17} />
                    </div>
                    <div>
                      <strong>Rendez-vous à venir</strong>
                      <p>Consultez votre planning commercial.</p>
                    </div>
                  </div>
                  <div className="notification-item">
                    <div className="notification-symbol green-symbol">
                      <CircleDollarSign size={17} />
                    </div>
                    <div>
                      <strong>Activité commerciale</strong>
                      <p>Une nouvelle opportunité a été enregistrée.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="topbar-divider" />

            <button
              className="topbar-profile"
              onClick={() => setShowProfile(!showProfile)}
            >
              <div className="profile-avatar top-profile-avatar">YW</div>
              <span>Yohane</span>
              <ChevronDown size={15} />
            </button>
          </div>
        </header>

        <div className="page-content">
          {activePage === "Vue d'ensemble" ? (
            <>
              <section className="welcome-section animate-in">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-dot" />
                    VOTRE ESPACE DE TRAVAIL
                  </div>
                  <h1>Bonjour Yohane <span className="wave">✳</span></h1>
                  <p>
                    Voici ce qui se passe dans votre entreprise aujourd'hui.
                  </p>
                </div>

                <div className="welcome-actions">
                  <button
                    className="secondary-button"
                    onClick={() =>
                      window.alert("Les rapports détaillés seront disponibles dans une prochaine version.")
                    }
                  >
                    <ChartNoAxesCombined size={17} />
                    Voir les rapports
                  </button>

                  <div className="new-menu-wrapper">
                    <button
                      className="primary-button"
                      onClick={() => setShowNewMenu(!showNewMenu)}
                    >
                      <Plus size={18} />
                      Créer
                      <ChevronDown size={15} />
                    </button>

                    {showNewMenu && (
                      <div className="create-popover">
                        {["Nouveau client", "Nouveau prospect", "Nouvelle tâche"].map(
                          (label) => (
                            <button
                              key={label}
                              onClick={() => {
                                setShowNewMenu(false);
                                window.alert(
                                  `${label} : le formulaire sera connecté à Supabase dans la prochaine étape.`
                                );
                              }}
                            >
                              <Plus size={15} />
                              {label}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="stats-grid">
                <StatCard
                  title="Clients"
                  value="248"
                  change="+12,8 %"
                  positive
                  icon={Users}
                  iconClass="icon-indigo"
                  index={1}
                />

                <StatCard
                  title="Prospects actifs"
                  value="64"
                  change="+8,2 %"
                  positive
                  icon={Target}
                  iconClass="icon-purple"
                  index={2}
                />

                <StatCard
                  title="Chiffre d'affaires"
                  value="24,85 M"
                  change="+18,6 %"
                  positive
                  icon={CircleDollarSign}
                  iconClass="icon-green"
                  index={3}
                />

                <StatCard
                  title="Tâches en cours"
                  value="18"
                  change="-4,3 %"
                  positive={false}
                  icon={CheckSquare}
                  iconClass="icon-orange"
                  index={1}
                />
              </section>

              <section className="analytics-grid">
                <RevenueChart />
                <PipelinePanel />
              </section>

              <section className="bottom-grid">
                <ClientsTable />
                <ActivityPanel />
              </section>

              <footer className="page-footer">
                <span>© 2026 Orbit CRM</span>
                <span>
                  Conçu pour simplifier votre quotidien
                  <span className="footer-heart"> · </span>
                  Version démo
                </span>
              </footer>
            </>
          ) : (
            <section className="placeholder-page animate-in">
              <div className="placeholder-icon">
                {activePage === "Clients" && <Users size={28} />}
                {activePage === "Prospects" && <Target size={28} />}
                {activePage === "Rendez-vous" && <CalendarDays size={28} />}
                {activePage === "Tâches" && <CheckSquare size={28} />}
                {activePage === "Rapports" && <ChartNoAxesCombined size={28} />}
                {activePage === "Paramètres" && <Settings size={28} />}
              </div>
              <h1>{activePage}</h1>
              <p>
                Cet espace fait partie de CRM Pro. Nous allons le développer
                et connecter ses données à Supabase.
              </p>
              <button
                className="primary-button"
                onClick={() => setActivePage("Vue d'ensemble")}
              >
                <ArrowRight size={17} />
                Retour au dashboard
              </button>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
```
