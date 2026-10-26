```tsx
"use client";

import { useState } from "react";
import type { ReactNode } from "react";

const initialClients = [
  { id: 1, name: "Aminata Diallo", company: "NovaTech", email: "aminata@novatech.sn", status: "Actif", amount: "850 000 FCFA", initials: "AD", color: "purple" },
  { id: 2, name: "Moussa Ndiaye", company: "Teranga Group", email: "moussa@teranga.sn", status: "Prospect", amount: "420 000 FCFA", initials: "MN", color: "orange" },
  { id: 3, name: "Fatou Sow", company: "Digital Wave", email: "fatou@digitalwave.sn", status: "Actif", amount: "1 200 000 FCFA", initials: "FS", color: "green" },
  { id: 4, name: "Ibrahima Fall", company: "Smart Solutions", email: "ibrahima@smart.sn", status: "En attente", amount: "275 000 FCFA", initials: "IF", color: "blue" },
  { id: 5, name: "Mariama Ba", company: "Ba Consulting", email: "mariama@ba.sn", status: "Actif", amount: "630 000 FCFA", initials: "MB", color: "pink" },
];

const sales = [
  { month: "Mai", value: 45 },
  { month: "Juin", value: 68 },
  { month: "Juil", value: 52 },
  { month: "Août", value: 82 },
  { month: "Sept", value: 63 },
  { month: "Oct", value: 95 },
  { month: "Nov", value: 72 },
  { month: "Déc", value: 88 },
];

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const paths: Record<string, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    chart: <><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-5 5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    message: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.8 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.8-1l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.8-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.8 1l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2z" transform="translate(-1 -1) scale(1.08)" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    money: <><rect x="2" y="6" width="20" height="13" rx="2" /><path d="M16 12h.01M6 12h.01M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" /><path d="M2 9a4 4 0 0 0 4-3M18 19a4 4 0 0 1 4-3" /></>,
    dots: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>,
  };

  return <svg {...common} aria-hidden="true">{paths[name] ?? paths.grid}</svg>;
}

export default function Home() {
  const [active, setActive] = useState("Vue d'ensemble");
  const [clients, setClients] = useState(initialClients);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [notice, setNotice] = useState("");

  const filteredClients = clients.filter((client) =>
    `${client.name} ${client.company} ${client.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function addClient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!clientName.trim() || !clientCompany.trim() || !clientEmail.trim()) return;

    const initials = clientName
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    setClients((previous) => [
      {
        id: Date.now(),
        name: clientName.trim(),
        company: clientCompany.trim(),
        email: clientEmail.trim(),
        status: "Prospect",
        amount: "0 FCFA",
        initials,
        color: "purple",
      },
      ...previous,
    ]);

    setClientName("");
    setClientCompany("");
    setClientEmail("");
    setShowForm(false);
    setActive("Clients");
    setNotice("Client ajouté avec succès.");
    window.setTimeout(() => setNotice(""), 3000);
  }

  const navGroups = [
    {
      label: "ESPACE DE TRAVAIL",
      items: [
        { name: "Vue d'ensemble", icon: "grid" },
        { name: "Clients", icon: "users" },
        { name: "Ventes", icon: "chart" },
        { name: "Activités", icon: "calendar" },
      ],
    },
    {
      label: "COMMUNICATION",
      items: [{ name: "Messages", icon: "message" }],
    },
  ];

  const stats = [
    { label: "Chiffre d'affaires", value: "12,8 M", suffix: "FCFA", change: "+12,8%", icon: "money", tone: "violet", detail: "vs. mois dernier" },
    { label: "Clients actifs", value: String(clients.filter((c) => c.status === "Actif").length + 124), suffix: "", change: "+8,2%", icon: "users", tone: "blue", detail: "vs. mois dernier" },
    { label: "Nouveaux prospects", value: "48", suffix: "", change: "+18,4%", icon: "chart", tone: "orange", detail: "vs. mois dernier" },
    { label: "Taux de conversion", value: "24,6", suffix: "%", change: "+4,3%", icon: "arrow", tone: "green", detail: "vs. mois dernier" },
  ];

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a href="#" className="brand" onClick={() => setActive("Vue d'ensemble")}>
          <span className="brand-mark"><span /></span>
          <span className="brand-name">nexora<span>.</span><small>BUSINESS SUITE</small></span>
        </a>

        <div className="workspace">
          <div className="workspace-avatar">N</div>
          <div className="workspace-copy"><strong>Nexora Studio</strong><span>Plan professionnel</span></div>
          <span className="workspace-chevron">⌄</span>
        </div>

        {navGroups.map((group) => (
          <div className="nav-group" key={group.label}>
            <p className="nav-label">{group.label}</p>
            {group.items.map((item) => (
              <button
                key={item.name}
                onClick={() => setActive(item.name)}
                className={`nav-item ${active === item.name ? "selected" : ""}`}
              >
                <Icon name={item.icon} size={18} />
                <span>{item.name}</span>
                {item.name === "Messages" && <span className="nav-badge">3</span>}
              </button>
            ))}
          </div>
        ))}

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-spark">✳</div>
            <strong>Passez à la vitesse supérieure</strong>
            <p>Découvrez tout le potentiel de Nexora.</p>
            <button onClick={() => setNotice("La fonctionnalité Premium sera bientôt disponible.")}>Découvrir Premium <span>↗</span></button>
          </div>
          <button className={`nav-item ${active === "Paramètres" ? "selected" : ""}`} onClick={() => setActive("Paramètres")}><Icon name="settings" size={18} /><span>Paramètres</span></button>
          <div className="profile">
            <div className="profile-avatar">YW</div>
            <div className="profile-copy"><strong>Yohane W.</strong><span>Administrateur</span></div>
            <button className="icon-button profile-menu" aria-label="Options du profil" onClick={() => setNotice("Profil administrateur")}><Icon name="dots" /></button>
          </div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-separator">/</span><strong>{active}</strong></div>
          <div className="topbar-actions">
            <label className="global-search"><Icon name="search" size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un client..." /><kbd>⌘ K</kbd></label>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setNotice("Vous êtes à jour !")}><Icon name="bell" size={19} /><span /></button>
            <div className="top-avatar">YW</div>
          </div>
        </header>

        <div className="page-content">
          <div className="welcome-row">
            <div>
              <div className="eyebrow"><span className="live-dot" /> VOTRE ESPACE BUSINESS</div>
              <h1>{active === "Vue d'ensemble" ? "Bonjour Yohane 👋" : active}</h1>
              <p className="page-subtitle">{active === "Vue d'ensemble" ? "Voici ce qui se passe dans votre entreprise aujourd'hui." : `Retrouvez et gérez vos données dans la section ${active.toLowerCase()}.`}</p>
            </div>
            <div className="welcome-actions">
              <button className="button-secondary" onClick={() => setNotice("Rapport prêt à être connecté à vos données.")}><Icon name="chart" size={16} /> Exporter le rapport</button>
              <button className="button-primary" onClick={() => setShowForm(true)}><Icon name="plus" size={17} /> Nouveau client</button>
            </div>
          </div>

          {notice && <div className="notice"><Icon name="check" size={17} />{notice}<button onClick={() => setNotice("")}>×</button></div>}

          {active === "Paramètres" ? (
            <section className="panel settings-panel">
              <div className="panel-heading"><div><h2>Paramètres de l'espace</h2><p>Gérez les préférences de votre environnement.</p></div></div>
              <div className="settings-row"><div><strong>Profil de l'entreprise</strong><p>Nexora Studio · Espace de démonstration</p></div><span className="status-pill status-active">Actif</span></div>
              <div className="settings-row"><div><strong>Notifications</strong><p>Les alertes sont activées dans cette démo.</p></div><span className="status-pill status-active">Activées</span></div>
              <div className="settings-row"><div><strong>Base de données</strong><p>Supabase sera connecté lors de la prochaine étape.</p></div><span className="status-pill status-pending">À configurer</span></div>
            </section>
          ) : active === "Messages" || active === "Activités" ? (
            <section className="panel empty-panel"><div className="empty-icon"><Icon name={active === "Messages" ? "message" : "calendar"} size={28} /></div><h2>{active === "Messages" ? "Votre espace de communication" : "Suivi des activités"}</h2><p>Cette section est prête pour l'intégration de vos données et fonctionnalités.</p><button className="button-primary" onClick={() => setNotice("Cette fonctionnalité sera connectée dans une prochaine étape.")}>Configurer cette section</button></section>
          ) : (
            <>
              <section className="stats-grid">
                {stats.map((stat, index) => (
                  <article className="stat-card" key={stat.label} style={{ animationDelay: `${index * 80}ms` }}>
                    <div className="stat-top"><div className={`stat-icon ${stat.tone}`}><Icon name={stat.icon} size={19} /></div><button className="icon-button muted-icon" aria-label={`Options ${stat.label}`} onClick={() => setNotice(`Statistique : ${stat.label}`)}><Icon name="dots" size={19} /></button></div>
                    <p className="stat-label">{stat.label}</p>
                    <div className="stat-value">{stat.value}<span>{stat.suffix}</span></div>
                    <div className="stat-footer"><span className="change-pill"><Icon name="arrow" size={12} /> {stat.change}</span><span className="stat-detail">{stat.detail}</span></div>
                  </article>
                ))}
              </section>

              <section className="middle-grid">
                <article className="panel revenue-panel">
                  <div className="panel-heading"><div><h2>Vue des revenus</h2><p>Suivez les performances de votre activité.</p></div><button className="select-button" onClick={() => setNotice("Période sélectionnée : cette année.")}>Cette année⌄</button></div>
                  <div className="revenue-summary"><strong>48 650 000 <span>FCFA</span></strong><span className="revenue-growth">↗ 14,8% <small>cette année</small></span></div>
                  <div className="chart" role="img" aria-label="Graphique illustratif des revenus mensuels">
                    <div className="chart-grid"><span>10 M</span><span>7,5 M</span><span>5 M</span><span>2,5 M</span><span>0</span></div>
                    <div className="chart-bars">{sales.map((item, index) => <div className="bar-column" key={item.month}><div className={`bar ${index === 5 ? "bar-highlight" : ""}`} style={{ height: `${item.value}%` }}><span className="bar-tooltip">{item.value * 100000} FCFA</span></div><span className="bar-label">{item.month}</span></div>)}</div>
                  </div>
                  <div className="chart-legend"><span className="legend-dot" /> Revenus mensuels <span className="chart-caption">Données de démonstration</span></div>
                </article>

                <article className="panel activity-panel">
                  <div className="panel-heading"><div><h2>Activités récentes</h2><p>Les dernières mises à jour.</p></div><button className="icon-button" aria-label="Voir les activités" onClick={() => setActive("Activités")}><Icon name="arrow" size={17} /></button></div>
                  <div className="activity-list">
                    <div className="activity-item"><div className="activity-icon activity-purple"><Icon name="users" size={17} /></div><div className="activity-copy"><strong>Nouveau client ajouté</strong><p>Aminata Diallo · NovaTech</p><span>Il y a 12 min</span></div></div>
                    <div className="activity-item"><div className="activity-icon activity-green"><Icon name="check" size={17} /></div><div className="activity-copy"><strong>Facture réglée</strong><p>Facture #INV-024 · 450 000 FCFA</p><span>Il y a 45 min</span></div></div>
                    <div className="activity-item"><div className="activity-icon activity-orange"><Icon name="calendar" size={17} /></div><div className="activity-copy"><strong>Rendez-vous planifié</strong><p>Réunion commerciale</p><span>Il y a 2 heures</span></div></div>
                    <div className="activity-item"><div className="activity-icon activity-blue"><Icon name="message" size={17} /></div><div className="activity-copy"><strong>Nouveau message</strong><p>Demande de devis · Teranga</p><span>Il y a 3 heures</span></div></div>
                  </div>
                  <button className="view-all" onClick={() => setActive("Activités")}>Voir toutes les activités <span>→</span></button>
                </article>
              </section>

              <section className="panel clients-panel">
                <div className="panel-heading clients-heading"><div><h2>{active === "Ventes" ? "Suivi commercial" : "Clients récents"}</h2><p>Gérez vos relations et vos opportunités commerciales.</p></div><div className="table-actions"><label className="table-search"><Icon name="search" size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filtrer les clients..." /></label><button className="button-secondary compact-button" onClick={() => setShowForm(true)}><Icon name="plus" size={15} /> Ajouter</button></div></div>
                <div className="table-wrap"><table><thead><tr><th>CLIENT</th><th>STATUT</th><th>VALEUR COMMERCIALE</th><th>EMAIL</th><th></th></tr></thead><tbody>
                  {filteredClients.map((client) => <tr key={client.id}><td><div className="client-cell"><div className={`client-avatar avatar-${client.color}`}>{client.initials}</div><div><strong>{client.name}</strong><span>{client.company}</span></div></div></td><td><span className={`status-pill ${client.status === "Actif" ? "status-active" : client.status === "Prospect" ? "status-prospect" : "status-pending"}`}><span className="status-dot" />{client.status}</span></td><td className="amount-cell">{client.amount}</td><td className="email-cell">{client.email}</td><td><button className="icon-button row-menu" aria-label={`Options pour ${client.name}`} onClick={() => setNotice(`Client sélectionné : ${client.name}`)}><Icon name="dots" size={19} /></button></td></tr>)}
                  {filteredClients.length === 0 && <tr><td colSpan={5} className="no-results">Aucun client ne correspond à votre recherche.</td></tr>}
                </tbody></table></div>
                <div className="table-footer"><span>Affichage de <strong>{filteredClients.length}</strong> client(s)</span><button className="view-all" onClick={() => setActive("Clients")}>Voir tous les clients <span>→</span></button></div>
              </section>
            </>
          )}

          <footer className="page-footer"><span>© 2026 Nexora Business Suite</span><span><span className="footer-status" /> Tous les systèmes opérationnels</span><span>Conçu avec soin pour les PME.</span></footer>
        </div>
      </section>

      {showForm && <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><div className="modal-kicker">GESTION CLIENT</div><h2 id="modal-title">Ajouter un client</h2><p>Renseignez les informations de votre nouveau contact.</p></div><button className="icon-button close-button" aria-label="Fermer" onClick={() => setShowForm(false)}>×</button></div><form onSubmit={addClient}><label>Nom complet<input autoFocus value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ex. Awa Diop" required /></label><label>Entreprise<input value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} placeholder="Ex. Entreprise SARL" required /></label><label>Adresse e-mail<input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="contact@entreprise.sn" required /></label><div className="modal-actions"><button type="button" className="button-secondary" onClick={() => setShowForm(false)}>Annuler</button><button type="submit" className="button-primary"><Icon name="plus" size={16} /> Créer le client</button></div></form></section></div>}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
        :root{--ink:#182230;--muted:#8490a2;--line:#edf0f5;--purple:#6855e8;--purple-dark:#5541d7;--surface:#fff;--canvas:#f8f9fc}
        *{box-sizing:border-box}
        body{margin:0;background:var(--canvas);font-family:'DM Sans',sans-serif;color:var(--ink);font-size:13px;-webkit-font-smoothing:antialiased}
        button,input{font:inherit}
        button{cursor:pointer}
        button:focus-visible,input:focus-visible{outline:3px solid #a9a0ff;outline-offset:2px}
        .app-shell{min-height:100vh;display:flex}
        .sidebar{width:248px;position:fixed;inset:0 auto 0 0;background:#fff;border-right:1px solid #edf0f5;padding:25px 17px 12px;display:flex;flex-direction:column;z-index:5}
        .brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:var(--ink);padding:0 8px 27px}
        .brand-mark{width:37px;height:37px;background:linear-gradient(140deg,#8474ff,#5540d8);border-radius:12px;display:grid;place-items:center;box-shadow:0 5px 13px #6955e83b;transform:rotate(-4deg)}
        .brand-mark span{width:15px;height:15px;border:3px solid white;border-radius:5px;position:relative}
        .brand-mark span:after{content:"";position:absolute;width:7px;height:7px;background:#c5bdff;border-radius:2px;right:-6px;bottom:-5px}
        .brand-name{font-family:Manrope,sans-serif;font-size:23px;font-weight:800;letter-spacing:-1px;line-height:1}
        .brand-name>span{color:var(--purple)}
        .brand-name small{display:block;font-family:'DM Sans',sans-serif;font-size:8px;font-weight:700;letter-spacing:2px;color:#a0a7b6;margin-top:6px}
        .workspace{display:flex;align-items:center;gap:10px;padding:12px 10px;border:1px solid #edf0f5;border-radius:11px;margin-bottom:27px;background:#fcfcfe}
        .workspace-avatar{width:32px;height:32px;display:grid;place-items:center;background:#eae6ff;color:#6550d9;border-radius:8px;font-weight:800;font-size:15px}
        .workspace-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:4px}
        .workspace-copy strong{font-size:11px;font-weight:700}.workspace-copy span{font-size:10px;color:#8b96a8}.workspace-chevron{color:#929bad}
        .nav-group{margin-bottom:25px}.nav-label{font-size:9px;font-weight:700;color:#a0a8b7;letter-spacing:1.1px;padding:0 11px;margin:0 0 10px}
        .nav-item{width:100%;display:flex;align-items:center;gap:12px;padding:11px 12px;border:0;background:transparent;border-radius:8px;color:#7d889b;text-align:left;margin-bottom:4px;font-size:12px;transition:background .2s,color .2s,transform .2s}
        .nav-item:hover{background:#f7f6ff;color:var(--purple);transform:translateX(2px)}.nav-item.selected{background:#f0edff;color:#5e4bdb;font-weight:700}.nav-badge{margin-left:auto;background:#e8e3ff;color:#5d4ad5;font-size:10px;padding:3px 7px;border-radius:5px}
        .sidebar-bottom{margin-top:auto}.upgrade-card{padding:15px 13px;background:linear-gradient(145deg,#f5f2ff,#f9f7ff);border:1px solid #e9e4ff;border-radius:11px;margin-bottom:19px;position:relative;overflow:hidden}
        .upgrade-card:after{content:"";position:absolute;width:85px;height:85px;border-radius:50%;border:1px solid #e4ddff;right:-35px;top:-34px;box-shadow:0 0 0 10px #eee9ff80,0 0 0 20px #eee9ff40}
        .upgrade-spark{font-size:20px;color:var(--purple);margin-bottom:9px}.upgrade-card strong{display:block;font-size:11px;max-width:145px;line-height:1.6}.upgrade-card p{font-size:10px;line-height:1.7;color:#8189a0;margin:6px 0 13px}.upgrade-card>button{width:100%;border:0;background:var(--purple);color:white;padding:9px 8px;border-radius:7px;font-size:10px;font-weight:700;display:flex;justify-content:space-between;box-shadow:0 3px 7px #6855e82c}
        .profile{display:flex;align-items:center;gap:10px;padding:17px 3px 2px;border-top:1px solid var(--line);margin-top:10px}.profile-avatar,.top-avatar{display:grid;place-items:center;background:#e7e3ff;color:#6550d9;font-weight:800;border-radius:50%;width:34px;height:34px;font-size:11px}.profile-copy{display:flex;flex:1;flex-direction:column;gap:4px}.profile-copy strong{font-size:11px}.profile-copy span{font-size:10px;color:#919bad}
        .main-area{margin-left:248px;width:calc(100% - 248px);min-height:100vh}.topbar{height:69px;background:#ffffffd9;backdrop-filter:blur(14px);border-bottom:1px solid #edf0f5;display:flex;align-items:center;justify-content:space-between;padding:0 35px;position:sticky;top:0;z-index:4}.breadcrumbs{display:flex;gap:12px;align-items:center;font-size:11px;color:#98a1b1}.breadcrumbs strong{color:#344054;font-weight:600}.crumb-separator{color:#d4d9e3}.topbar-actions{display:flex;align-items:center;gap:19px}.global-search,.table-search{height:35px;border:1px solid #edf0f5;border-radius:8px;display:flex;align-items:center;gap:8px;padding:0 9px;color:#9aa3b2;background:#fff}.global-search input,.table-search input{width:175px;border:0;outline:none;background:transparent;font-size:11px;color:var(--ink)}.global-search input::placeholder,.table-search input::placeholder{color:#a0a8b6}.global-search kbd{font-family:inherit;font-size:9px;padding:3px 5px;border:1px solid #e8ebf1;border-radius:4px;color:#9ca5b3;white-space:nowrap}
        .icon-button{border:0;background:transparent;color:#8a95a6;display:grid;place-items:center;width:31px;height:31px;border-radius:7px;transition:background .2s,color .2s}.icon-button:hover{background:#f0edff;color:var(--purple)}.notification-button{position:relative}.notification-button>span{position:absolute;width:6px;height:6px;background:#f08b78;border:1px solid white;border-radius:50%;right:5px;top:4px}.top-avatar{width:32px;height:32px}
        .page-content{max-width:1600px;margin:0 auto;padding:34px 35px 20px}.welcome-row{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:28px}.eyebrow{display:flex;align-items:center;gap:7px;font-size:9px;font-weight:700;letter-spacing:1.4px;color:#8d96a9;margin-bottom:11px}.live-dot{width:7px;height:7px;background:#35c69b;border-radius:50%;box-shadow:0 0 0 3px #35c69b20}.welcome-row h1{font-family:Manrope,sans-serif;font-size:27px;letter-spacing:-1.1px;margin:0 0 8px;font-weight:800;color:#1b2535}.page-subtitle{margin:0;color:#8c96a8;font-size:12px}.welcome-actions{display:flex;gap:9px;flex-shrink:0}
        .button-primary,.button-secondary{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 13px;border-radius:8px;font-size:11px;font-weight:600;transition:transform .2s,box-shadow .2s,background .2s;white-space:nowrap}.button-primary{background:var(--purple);border:1px solid var(--purple);color:white;box-shadow:0 3px 8px #6855e825}.button-primary:hover{background:var(--purple-dark);transform:translateY(-1px);box-shadow:0 5px 13px #6855e83b}.button-secondary{background:white;border:1px solid #e7eaf0;color:#626e81}.button-secondary:hover{background:#f8f7ff;border-color:#d9d2ff;color:var(--purple)}
        .notice{display:flex;align-items:center;gap:9px;background:#ecfaf5;color:#17815f;border:1px solid #d0f1e4;border-radius:8px;padding:11px 14px;margin:-10px 0 20px;font-size:12px;animation:fadeUp .25s ease}.notice button{margin-left:auto;border:0;background:transparent;color:inherit;font-size:20px}
        .stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-bottom:19px}.stat-card,.panel{background:white;border:1px solid #edf0f5;border-radius:12px;box-shadow:0 2px 5px #1c274008}.stat-card{padding:18px 19px;min-width:0;animation:fadeUp .45s both}.stat-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}.stat-icon{width:37px;height:37px;border-radius:10px;display:grid;place-items:center}.stat-icon.violet{color:#6e58e8;background:#f0edff}.stat-icon.blue{color:#4285e9;background:#eaf3ff}.stat-icon.orange{color:#e99a48;background:#fff3e5}.stat-icon.green{color:#27ae88;background:#e4f9f1}.muted-icon{color:#c0c6d0}.stat-label{font-size:11px;color:#818c9f;margin:0 0 8px}.stat-value{font-family:Manrope,sans-serif;font-size:27px;font-weight:800;letter-spacing:-1px;white-space:nowrap}.stat-value>span{font-size:11px;letter-spacing:0;font-weight:600;color:#7d889b;margin-left:5px}.stat-footer{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:12px}.change-pill{display:inline-flex;align-items:center;gap:3px;padding:4px 6px;border-radius:5px;background:#eaf9f2;color:#1ba47b;font-size:9px;font-weight:700}.stat-detail{font-size:9px;color:#a1a9b7}
        .middle-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(300px,1fr);gap:17px;margin-bottom:19px}.panel{min-width:0;overflow:hidden}.revenue-panel,.activity-panel{padding:21px 21px 17px}.panel-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.panel-heading h2{font-family:Manrope,sans-serif;font-size:14px;letter-spacing:-.25px;margin:0 0 6px;font-weight:800}.panel-heading p{font-size:10px;color:#919bad;margin:0}.select-button{padding:8px 10px;background:white;border:1px solid #e9edf3;border-radius:7px;color:#788396;font-size:10px}
        .revenue-summary{display:flex;align-items:center;gap:13px;margin-top:21px}.revenue-summary>strong{font-family:Manrope,sans-serif;font-size:23px;letter-spacing:-.7px}.revenue-summary>strong span{font-family:'DM Sans',sans-serif;font-size:10px;color:#8c96a8;letter-spacing:0}.revenue-growth{color:#1da67a;font-size:10px;font-weight:700}.revenue-growth small{color:#98a2b1;font-weight:400}
        .chart{height:180px;display:flex;position:relative;margin-top:20px;padding-bottom:24px}.chart-grid{position:absolute;inset:0 0 24px;display:flex;flex-direction:column;justify-content:space-between}.chart-grid span{position:relative;font-size:9px;color:#a1a9b7;width:35px}.chart-grid span:after{content:"";position:absolute;left:34px;right:0;top:5px;width:calc(100% * 8 - 20px);border-top:1px dashed #edf0f5}.chart-bars{position:relative;margin-left:39px;flex:1;display:flex;align-items:stretch;justify-content:space-around;gap:9px;z-index:1}.bar-column{height:100%;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;min-width:0}.bar{position:relative;width:min(27px,75%);min-height:3px;border-radius:5px 5px 2px 2px;background:linear-gradient(180deg,#c6bfff,#e8e5ff);transition:filter .2s,transform .2s;animation:growBar .8s both;transform-origin:bottom}.bar:hover{filter:saturate(1.5);transform:scaleX(1.08)}.bar-highlight{background:linear-gradient(180deg,#7664f2,#a599ff);box-shadow:0 4px 12px #7562ef28}.bar-tooltip{display:none;position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);white-space:nowrap;padding:5px 7px;background:#20283a;color:white;border-radius:5px;font-size:9px;z-index:2}.bar:hover .bar-tooltip{display:block}.bar-label{position:absolute;bottom:-20px;font-size:9px;color:#98a2b2}.chart-legend{display:flex;align-items:center;gap:7px;margin-top:8px;font-size:9px;color:#8994a6}.legend-dot{width:7px;height:7px;border-radius:2px;background:#7664f2}.chart-caption{margin-left:auto;color:#b0b6c2;font-size:9px}
        .activity-list{margin-top:18px}.activity-item{display:flex;gap:11px;padding:12px 0;border-bottom:1px solid #f0f2f6}.activity-item:last-child{border-bottom:0}.activity-icon{width:33px;height:33px;border-radius:9px;display:grid;place-items:center;flex-shrink:0}.activity-purple{background:#f0edff;color:#7764e9}.activity-green{background:#e6f9f0;color:#23a980}.activity-orange{background:#fff2e4;color:#e9a04f}.activity-blue{background:#eaf3ff;color:#4b91ed}.activity-copy{min-width:0;display:flex;flex-direction:column;gap:4px}.activity-copy strong{font-size:10px;font-weight:700}.activity-copy p{font-size:10px;color:#818da0;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.activity-copy>span{font-size:9px;color:#a7afbd}.view-all{display:flex;align-items:center;gap:8px;border:0;background:transparent;color:var(--purple);font-size:10px;font-weight:700;padding:8px 0}.view-all span{font-size:15px;transition:transform .2s}.view-all:hover span{transform:translateX(4px)}
        .clients-panel{margin-bottom:20px}.clients-heading{padding:20px 21px 17px;align-items:center}.table-actions{display:flex;gap:9px;align-items:center}.table-search{height:33px}.table-search input{width:135px}.compact-button{padding:8px 10px}.table-wrap{width:100%;overflow-x:auto}table{width:100%;border-collapse:collapse;text-align:left;white-space:nowrap}thead{background:#fafbfe}th{font-size:9px;letter-spacing:.65px;color:#9aa3b2;font-weight:700;padding:12px 19px;border-top:1px solid #f0f2f6;border-bottom:1px solid #f0f2f6}td{padding:13px 19px;border-bottom:1px solid #f0f2f6;font-size:10px}tbody tr{transition:background .2s}tbody tr:hover{background:#fcfbff}.client-cell{display:flex;align-items:center;gap:10px}.client-avatar{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;font-size:10px;font-weight:700;flex-shrink:0}.avatar-purple{background:#eeeaff;color:#705de1}.avatar-orange{background:#fff0df;color:#d78b35}.avatar-green{background:#e1f7ee;color:#279d79}.avatar-blue{background:#e7f1ff;color:#4b86d5}.avatar-pink{background:#ffeaf2;color:#d66e98}.client-cell>div:last-child{display:flex;flex-direction:column;gap:5px}.client-cell strong{font-size:10px;font-weight:700}.client-cell>div:last-child span{font-size:9px;color:#929bad}.status-pill{display:inline-flex;align-items:center;gap:6px;padding:5px 8px;border-radius:5px;font-size:9px;font-weight:600}.status-dot{width:5px;height:5px;border-radius:50%;background:currentColor}.status-active{background:#eaf8f1;color:#219c73}.status-prospect{background:#f0edff;color:#6e58db}.status-pending{background:#fff4e4;color:#d9963e}.amount-cell{font-weight:700;color:#384356}.email-cell{color:#8490a2}.row-menu{margin-left:auto}.no-results{text-align:center;padding:25px;color:#8b95a6}.table-footer{display:flex;justify-content:space-between;align-items:center;padding:5px 20px 7px;color:#99a2b1;font-size:10px}.table-footer strong{color:#596579}
        .page-footer{display:flex;justify-content:space-between;gap:15px;flex-wrap:wrap;padding:8px 0 3px;font-size:9px;color:#a0a8b6}.page-footer>span:nth-child(2){display:flex;align-items:center;gap:6px}.footer-status{width:6px;height:6px;background:#35c69b;border-radius:50%}
        .modal-overlay{position:fixed;inset:0;background:#17172e80;backdrop-filter:blur(5px);z-index:20;display:grid;place-items:center;padding:20px;animation:fadeIn .2s ease}.modal{width:100%;max-width:445px;background:white;border-radius:16px;padding:27px;box-shadow:0 24px 80px #15132c30;animation:modalIn .3s ease}.modal-heading{display:flex;justify-content:space-between;gap:15px;margin-bottom:23px}.modal-kicker{font-size:9px;font-weight:800;letter-spacing:1.3px;color:var(--purple);margin-bottom:9px}.modal-heading h2{font-family:Manrope,sans-serif;font-size:22px;letter-spacing:-.7px;margin:0 0 7px}.modal-heading p{font-size:11px;color:#8792a4;margin:0}.close-button{font-size:24px;align-self:flex-start}.modal form{display:flex;flex-direction:column;gap:16px}.modal form>label{display:flex;flex-direction:column;gap:7px;font-size:11px;font-weight:700;color:#495568}.modal form input{width:100%;height:41px;border:1px solid #e6eaf1;border-radius:8px;padding:0 12px;color:var(--ink);background:#fff;transition:border .2s,box-shadow .2s}.modal form input:focus{border-color:#9386f3;box-shadow:0 0 0 3px #7460e817;outline:none}.modal form input::placeholder{color:#b0b7c3;font-weight:400}.modal-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:8px;padding-top:17px;border-top:1px solid #f0f2f6}
        .settings-panel{padding:22px}.settings-row{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:19px 0;border-bottom:1px solid var(--line)}.settings-row:last-child{border:0}.settings-row strong{font-size:12px}.settings-row p{font-size:10px;color:#8994a5;margin:6px 0 0}.empty-panel{min-height:350px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px}.empty-icon{width:60px;height:60px;border-radius:17px;background:#f0edff;color:var(--purple);display:grid;place-items:center;margin-bottom:16px}.empty-panel h2{font-family:Manrope,sans-serif;font-size:19px;margin:0 0 9px}.empty-panel p{color:#8b95a6;font-size:12px;margin:0 0 21px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes modalIn{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes growBar{from{transform:scaleY(0)}to{transform:scaleY(1)}}
        @media(min-width:1500px){.page-content{padding-left:45px;padding-right:45px}.stats-grid{gap:20px}.stat-card{padding:22px}.middle-grid{gap:20px}}
        @media(max-width:1150px){.sidebar{width:220px;padding-left:13px;padding-right:13px}.main-area{margin-left:220px;width:calc(100% - 220px)}.page-content{padding:28px 23px 18px}.topbar{padding:0 23px}.stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.middle-grid{grid-template-columns:minmax(0,1fr)}.activity-panel{padding-bottom:12px}.activity-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:20px}}
        @media(max-width:760px){.sidebar{width:66px;padding:20px 8px 10px;align-items:center}.brand{padding:0 0 28px}.brand-name,.workspace-copy,.workspace-chevron,.nav-label,.nav-item>span,.upgrade-card,.profile-copy,.profile-menu{display:none}.brand-mark{width:38px;height:38px}.workspace{padding:7px;border:0;background:transparent;margin-bottom:23px}.nav-group{width:100%;margin-bottom:19px}.nav-item{justify-content:center;padding:12px 0}.nav-item svg{width:19px;height:19px}.profile{justify-content:center;padding-top:13px}.profile-avatar{width:34px;height:34px}.main-area{margin-left:66px;width:calc(100% - 66px)}.topbar{height:60px;padding:0 15px}.topbar-actions{gap:10px}.global-search{width:35px;padding:0;justify-content:center;border:0;background:transparent}.global-search input,.global-search kbd{display:none}.page-content{padding:25px 15px 15px}.welcome-row{align-items:flex-start;flex-direction:column;margin-bottom:22px;gap:17px}.welcome-row h1{font-size:24px}.welcome-actions{width:100%;flex-wrap:wrap}.welcome-actions button{flex:1}.stats-grid{gap:10px}.stat-card{padding:13px}.stat-value{font-size:22px}.stat-footer{gap:4px}.stat-detail{font-size:8px}.middle-grid{gap:12px}.revenue-panel,.activity-panel{padding:16px 13px}.revenue-summary>strong{font-size:19px}.chart-bars{gap:4px}.bar{width:70%}.activity-list{grid-template-columns:1fr}.clients-heading{align-items:flex-start;flex-direction:column;padding:16px 13px}.table-actions{width:100%}.table-search{flex:1;min-width:0}.table-search input{width:100%;min-width:0}.table-wrap table{min-width:690px}th,td{padding:12px}.page-footer{gap:8px;flex-direction:column}.settings-row{align-items:flex-start;flex-direction:column}}
        @media(max-width:400px){.page-content{padding-left:10px;padding-right:10px}.topbar{padding:0 10px}.stats-grid{gap:7px}.stat-card{padding:10px}.stat-value{font-size:19px}.stat-value>span{font-size:9px}.stat-label{font-size:10px}.change-pill{font-size:8px}.welcome-actions button{font-size:10px;padding:9px 7px}.panel-heading h2{font-size:13px}}
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important}}
      `}</style>
    </main>
  );
}
```
