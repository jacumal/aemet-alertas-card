/*
 * AEMET Alertas Card
 * Lovelace card for the AEMET Alertas Home Assistant integration.
 * https://github.com/jacumal/aemet-alertas
 */

class AemetAlertasCard extends HTMLElement {
  static getStubConfig() {
    return {
      entity: "sensor.alertas_amarillas_litoral_norte_de_valencia",
      mode: "compact",
      show_when_clear: true,
      max_alerts: 5,
    };
  }

  setConfig(config) {
    if (!config || !config.entity) {
      throw new Error("AEMET Alertas Card: 'entity' is required");
    }

    const mode = config.mode || "compact";
    if (!["compact", "detailed", "auto"].includes(mode)) {
      throw new Error("AEMET Alertas Card: mode must be compact, detailed or auto");
    }

    this.config = {
      entity: config.entity,
      mode,
      show_when_clear: config.show_when_clear !== false,
      max_alerts: Math.max(1, Number(config.max_alerts) || 5),
    };

    this._rendered = false;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    if (!this._hass || !this.config) return 2;
    const state = this._hass.states[this.config.entity];
    const alerts = state?.attributes?.avisos || [];
    const mode = this._getMode(alerts);
    return mode === "detailed" ? Math.min(2 + alerts.length * 4, 20) : Math.max(3, Math.ceil(alerts.length / 2) + 2);
  }

  _getMode(alerts) {
    if (this.config.mode === "auto") {
      return alerts.length > 0 ? "detailed" : "compact";
    }
    return this.config.mode;
  }

  _getState() {
    return this._hass?.states?.[this.config?.entity];
  }

  _getAlerts() {
    const state = this._getState();
    const alerts = Array.isArray(state?.attributes?.avisos) ? state.attributes.avisos : [];
    return alerts.slice(0, this.config.max_alerts);
  }

  _normalizeLevel(alert, state) {
    const raw = String(alert?.level || state?.attributes?.nivel || "").toLowerCase();
    if (["red", "rojo"].includes(raw)) return "red";
    if (["orange", "naranja", "amber"].includes(raw)) return "orange";
    if (["yellow", "amarillo"].includes(raw)) return "yellow";
    if (["green", "verde"].includes(raw)) return "green";
    return "none";
  }

  _levelInfo(level) {
    const info = {
      none: { label: "Sin avisos", icon: "mdi:weather-sunny", color: "var(--aemet-muted, #6b7280)" },
      green: { label: "Aviso verde", icon: "mdi:check-circle-outline", color: "#43a047" },
      yellow: { label: "Aviso amarillo", icon: "mdi:alert-outline", color: "#f9a825" },
      orange: { label: "Aviso naranja", icon: "mdi:alert", color: "#ef6c00" },
      red: { label: "Aviso rojo", icon: "mdi:alert-octagram", color: "#d32f2f" },
    };
    return info[level] || info.none;
  }

  _icon(name, size = 24) {
    return `<ha-icon icon="${this._escape(name)}" style="--mdc-icon-size:${size}px"></ha-icon>`;
  }

  _escape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  _formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return this._escape(value);
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  _formatProbability(value) {
    if (!value) return "—";
    return String(value).replace(/%$/, "%");
  }

  _getPhenomenon(alert) {
    const event = alert?.event || alert?.headline || "Aviso meteorológico";
    return event.replace(/^Aviso de\s+/i, "");
  }

  _getParameter(alert) {
    if (alert?.parameter) return alert.parameter;
    return alert?.description || "";
  }

  _render() {
    if (!this.config || !this._hass) return;

    const state = this._getState();
    const alerts = this._getAlerts();

    if (!state) {
      this.innerHTML = this._error("No se encuentra la entidad configurada.");
      return;
    }

    if (!alerts.length && !this.config.show_when_clear) {
      this.innerHTML = "";
      return;
    }

    const mode = this._getMode(alerts);
    this.innerHTML = mode === "detailed"
      ? this._renderDetailed(state, alerts)
      : this._renderCompact(state, alerts);

    this._rendered = true;
  }

  _renderCompact(state, alerts) {
    const primaryLevel = alerts.reduce((highest, alert) => {
      const order = { none: 0, green: 1, yellow: 2, orange: 3, red: 4 };
      const level = this._normalizeLevel(alert, state);
      return order[level] > order[highest] ? level : highest;
    }, "none");

    const info = this._levelInfo(primaryLevel);
    const area = state.attributes?.area || state.attributes?.friendly_name || "AEMET";
    const total = state.attributes?.total_avisos ?? alerts.length;

    return `
      ${this._styles()}
      <ha-card>
        <div class="compact" style="--aemet-accent:${info.color}">
          <div class="compact-header">
            <div class="icon">${this._icon(info.icon, 30)}</div>
            <div class="titles">
              <div class="title">AEMET Alertas</div>
              <div class="area">${this._escape(area)}</div>
            </div>
            <div class="badge">${this._escape(info.label)}</div>
          </div>
          <div class="compact-summary">
            <span>${this._icon("mdi:weather-lightning", 20)} ${this._escape(String(total))} aviso${total === 1 ? "" : "s"}</span>
            <span>${this._escape(this._getSummary(alerts))}</span>
          </div>
          ${alerts.length ? this._renderCompactAlerts(state, alerts) : this._renderClearState()}
        </div>
      </ha-card>`;
  }

  _renderCompactAlerts(state, alerts) {
    return `<div class="compact-list">${alerts.map((alert) => {
      const level = this._normalizeLevel(alert, state);
      const info = this._levelInfo(level);
      return `
        <div class="compact-alert" style="--alert-color:${info.color}">
          <div class="alert-marker"></div>
          <div class="alert-content">
            <div class="alert-title">${this._escape(this._getPhenomenon(alert))}</div>
            <div class="alert-meta">
              <span>${this._escape(alert.area_desc || state.attributes?.area || "")}</span>
              ${alert.onset ? `<span>Desde ${this._formatDate(alert.onset)}</span>` : ""}
              ${alert.expires ? `<span>Hasta ${this._formatDate(alert.expires)}</span>` : ""}
            </div>
          </div>
          <div class="alert-level">${this._escape(info.label.replace("Aviso ", ""))}</div>
        </div>`;
    }).join("")}</div>`;
  }

  _renderDetailed(state, alerts) {
    const area = state.attributes?.area || state.attributes?.friendly_name || "AEMET";

    return `
      ${this._styles()}
      <ha-card>
        <div class="detailed">
          <div class="detail-header">
            <div>
              <div class="title">AEMET Alertas</div>
              <div class="area">${this._escape(area)}</div>
            </div>
            <div class="count">${alerts.length} activo${alerts.length === 1 ? "" : "s"}</div>
          </div>
          ${alerts.length ? alerts.map((alert) => this._renderDetailAlert(state, alert)).join("") : this._renderClearState()}
        </div>
      </ha-card>`;
  }

  _renderDetailAlert(state, alert) {
    const level = this._normalizeLevel(alert, state);
    const info = this._levelInfo(level);
    const source = alert.source_url || alert.source || "";

    return `
      <section class="detail-alert" style="--alert-color:${info.color}">
        <div class="detail-accent"></div>
        <div class="detail-main">
          <div class="detail-title-row">
            <div class="detail-icon">${this._icon(info.icon, 28)}</div>
            <div class="detail-title-wrap">
              <div class="detail-title">${this._escape(this._getPhenomenon(alert))}</div>
              <div class="detail-headline">${this._escape(alert.headline || alert.event || "Aviso meteorológico")}</div>
            </div>
            <span class="level-chip">${this._escape(info.label)}</span>
          </div>

          <div class="metrics">
            ${this._metric("mdi:weather-rainy", "Parámetro", this._getParameter(alert))}
            ${this._metric("mdi:percent", "Probabilidad", this._formatProbability(alert.probability))}
            ${this._metric("mdi:alert-circle-outline", "Severidad", alert.severity || "—")}
            ${this._metric("mdi:clock-alert-outline", "Urgencia", alert.urgency || "—")}
            ${this._metric("mdi:shield-check-outline", "Certeza", alert.certainty || "—")}
            ${this._metric("mdi:map-marker-outline", "Zona", alert.area_desc || state.attributes?.area || "—")}
          </div>

          <div class="times">
            <div><strong>Inicio</strong><span>${this._formatDate(alert.onset || alert.effective)}</span></div>
            <div><strong>Fin</strong><span>${this._formatDate(alert.expires)}</span></div>
          </div>

          ${alert.description ? `<div class="text-block"><strong>Descripción</strong><p>${this._escape(alert.description)}</p></div>` : ""}
          ${alert.instruction ? `<div class="text-block"><strong>Recomendación</strong><p>${this._escape(alert.instruction)}</p></div>` : ""}
          ${source ? `<a class="source" href="${this._escape(source)}" target="_blank" rel="noopener">${this._icon("mdi:open-in-new", 17)} Ver aviso en AEMET</a>` : ""}
        </div>
      </section>`;
  }

  _metric(icon, label, value) {
    return `<div class="metric"><div class="metric-icon">${this._icon(icon, 19)}</div><div><small>${this._escape(label)}</small><span>${this._escape(value)}</span></div></div>`;
  }

  _getSummary(alerts) {
    if (!alerts.length) return "Sin avisos activos";
    const phenomena = [...new Set(alerts.map((a) => this._getPhenomenon(a)).filter(Boolean))];
    return phenomena.slice(0, 2).join(" · ") || "Avisos activos";
  }

  _renderClearState() {
    return `
      <div class="clear-state">
        ${this._icon("mdi:weather-sunny", 34)}
        <div><strong>Sin avisos activos</strong><span>No hay avisos meteorológicos activos en esta zona.</span></div>
      </div>`;
  }

  _error(message) {
    return `<ha-card><div class="error">${this._icon("mdi:alert-circle", 22)} ${this._escape(message)}</div></ha-card>`;
  }

  _styles() {
    return `<style>
      :host { display:block; }
      ha-card { overflow:hidden; }
      .compact, .detailed { font-family: var(--paper-font-body1_-_font-family, var(--ha-font-family, sans-serif)); color: var(--primary-text-color); }
      .compact { padding:16px; }
      .compact-header, .detail-header { display:flex; align-items:center; gap:12px; }
      .compact-header { padding-bottom:12px; border-bottom:1px solid var(--divider-color); }
      .icon, .detail-icon { color:var(--aemet-accent); display:flex; align-items:center; justify-content:center; }
      .titles, .detail-title-wrap { min-width:0; flex:1; }
      .title { font-size:18px; font-weight:700; line-height:1.25; }
      .area { margin-top:3px; color:var(--secondary-text-color); font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .badge, .level-chip, .count { border-radius:999px; padding:5px 9px; font-size:11px; font-weight:700; white-space:nowrap; }
      .badge { color:var(--aemet-accent); background:color-mix(in srgb, var(--aemet-accent) 14%, transparent); }
      .compact-summary { display:flex; justify-content:space-between; gap:12px; padding:12px 0; color:var(--secondary-text-color); font-size:13px; }
      .compact-summary span { display:flex; align-items:center; gap:5px; min-width:0; }
      .compact-summary span:last-child { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:right; }
      .compact-list { display:grid; gap:8px; }
      .compact-alert { display:flex; align-items:center; gap:10px; padding:10px; border-radius:10px; background:var(--secondary-background-color); }
      .alert-marker { width:4px; align-self:stretch; min-height:38px; border-radius:4px; background:var(--alert-color); }
      .alert-content { flex:1; min-width:0; }
      .alert-title { font-weight:650; font-size:14px; }
      .alert-meta { display:flex; flex-wrap:wrap; gap:8px; margin-top:3px; color:var(--secondary-text-color); font-size:11px; }
      .alert-level { color:var(--alert-color); font-size:11px; font-weight:700; text-transform:uppercase; }
      .detailed { padding:16px; }
      .detail-header { padding-bottom:12px; border-bottom:1px solid var(--divider-color); }
      .detail-header > div:first-child { flex:1; min-width:0; }
      .count { background:var(--secondary-background-color); color:var(--secondary-text-color); }
      .detail-alert { display:flex; margin-top:14px; border:1px solid var(--divider-color); border-radius:12px; overflow:hidden; background:var(--card-background-color, var(--primary-background-color)); }
      .detail-accent { width:5px; background:var(--alert-color); flex:0 0 5px; }
      .detail-main { padding:14px; width:100%; min-width:0; }
      .detail-title-row { display:flex; align-items:flex-start; gap:10px; }
      .detail-title-wrap { flex:1; min-width:0; }
      .detail-title { font-weight:750; font-size:16px; line-height:1.3; }
      .detail-headline { margin-top:3px; color:var(--secondary-text-color); font-size:12px; }
      .level-chip { color:var(--alert-color); background:color-mix(in srgb, var(--alert-color) 14%, transparent); }
      .metrics { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:8px; margin-top:14px; }
      .metric { display:flex; gap:7px; min-width:0; padding:9px; border-radius:9px; background:var(--secondary-background-color); }
      .metric-icon { color:var(--secondary-text-color); display:flex; }
      .metric div:last-child { min-width:0; }
      .metric small { display:block; color:var(--secondary-text-color); font-size:10px; }
      .metric span { display:block; margin-top:2px; font-size:12px; overflow-wrap:anywhere; }
      .times { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px; }
      .times > div { display:flex; justify-content:space-between; gap:8px; padding:8px 10px; border-radius:9px; background:var(--secondary-background-color); font-size:11px; }
      .times span { color:var(--secondary-text-color); text-align:right; }
      .text-block { margin-top:12px; font-size:12px; }
      .text-block strong { font-size:12px; }
      .text-block p { margin:5px 0 0; color:var(--secondary-text-color); line-height:1.5; }
      .source { display:inline-flex; align-items:center; gap:5px; margin-top:13px; color:var(--primary-color); font-size:12px; text-decoration:none; font-weight:600; }
      .clear-state { display:flex; align-items:center; gap:12px; padding:18px 4px 4px; color:var(--secondary-text-color); }
      .clear-state ha-icon { color:#43a047; }
      .clear-state strong { display:block; color:var(--primary-text-color); font-size:14px; }
      .clear-state span { display:block; margin-top:2px; font-size:12px; }
      .error { display:flex; align-items:center; gap:8px; padding:16px; color:var(--error-color); }
      @media (max-width: 520px) {
        .badge { display:none; }
        .compact-summary { display:block; }
        .compact-summary span:last-child { margin-top:5px; text-align:left; }
        .metrics { grid-template-columns:1fr 1fr; }
        .times { grid-template-columns:1fr; }
      }
    </style>`;
  }
}

if (!customElements.get("aemet-alertas-card")) {
  customElements.define("aemet-alertas-card", AemetAlertasCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "aemet-alertas-card")) {
  window.customCards.push({
    type: "aemet-alertas-card",
    name: "AEMET Alertas",
    description: "Muestra avisos meteorológicos de AEMET de forma compacta o detallada.",
    preview: true,
  });
}

console.info(
  "%c AEMET ALERTAS CARD %c 1.0.0 ",
  "color:#fff;background:#1565c0;font-weight:bold;padding:3px 6px",
  "color:#1565c0;background:#fff;font-weight:bold;padding:3px 6px"
);
