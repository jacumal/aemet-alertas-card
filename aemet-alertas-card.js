/*
 * AEMET Alertas Card — Premium Animated Edition
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
    return mode === "detailed"
      ? Math.min(2 + alerts.length * 5, 20)
      : Math.max(3, Math.ceil(alerts.length / 2) + 2);
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
      none: { label: "Sin avisos", icon: "mdi:weather-sunny", color: "#64748b" },
      green: { label: "Aviso verde", icon: "mdi:check-circle-outline", color: "#35b878" },
      yellow: { label: "Aviso amarillo", icon: "mdi:weather-pouring", color: "#f4b740" },
      orange: { label: "Aviso naranja", icon: "mdi:weather-lightning", color: "#f27a24" },
      red: { label: "Aviso rojo", icon: "mdi:alert-octagram", color: "#ef4444" },
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
    return value ? String(value) : "—";
  }

  _getPhenomenon(alert) {
    const event = alert?.event || alert?.headline || "Aviso meteorológico";
    return event.replace(/^Aviso de\s+/i, "");
  }

  _getPhenomenonType(alert) {
    const text = `${alert?.event || ""} ${alert?.headline || ""} ${alert?.description || ""} ${alert?.parameter || ""}`.toLowerCase();
    if (/torment|rayos|relámpago|electri/.test(text)) return "storm";
    if (/lluvia|precipit|chubasco|agua/.test(text)) return "rain";
    if (/viento|racha|km\/h/.test(text)) return "wind";
    if (/nieve|nevada|nevadas|hielo|helada/.test(text)) return "snow";
    if (/niebla|visibilidad/.test(text)) return "fog";
    if (/oleaje|marít|marit|costa|litoral|olas/.test(text)) return "waves";
    if (/temperatura|calor|máxima|maxima|mínima|minima/.test(text)) return "heat";
    if (/polvo|calima|arena/.test(text)) return "dust";
    return "weather";
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
  }

  _renderCompact(state, alerts) {
    const primaryLevel = alerts.reduce((highest, alert) => {
      const order = { none: 0, green: 1, yellow: 2, orange: 3, red: 4 };
      const level = this._normalizeLevel(alert, state);
      return order[level] > order[highest] ? level : highest;
    }, "none");

    const info = this._levelInfo(primaryLevel);
    const lead = alerts[0];
    const phenomenon = lead ? this._getPhenomenonType(lead) : "weather";
    const area = state.attributes?.area || state.attributes?.friendly_name || "AEMET";
    const total = state.attributes?.total_avisos ?? alerts.length;

    return `
      ${this._styles()}
      <ha-card>
        <div class="premium-card compact-card" style="--aemet-accent:${info.color}">
          ${this._weatherScene(phenomenon, primaryLevel)}
          <div class="card-content">
            <div class="compact-top">
              <div class="brand-row">
                <div class="brand-icon">${this._icon(info.icon, 28)}</div>
                <div class="title-wrap">
                  <div class="eyebrow">AEMET · AVISOS METEOROLÓGICOS</div>
                  <div class="title">${this._escape(area)}</div>
                </div>
              </div>
              <div class="level-badge">${this._escape(info.label)}</div>
            </div>

            <div class="hero-row">
              <div>
                <div class="hero-phenomenon">${this._escape(lead ? this._getPhenomenon(lead) : "Sin avisos activos")}</div>
                <div class="hero-summary">${this._escape(this._getSummary(alerts))}</div>
              </div>
              <div class="hero-icon">${this._phenomenonIcon(phenomenon, 68)}</div>
            </div>

            <div class="status-strip">
              <span>${this._icon("mdi:alert-circle-outline", 17)} ${this._escape(String(total))} aviso${total === 1 ? "" : "s"}</span>
              <span>${this._icon("mdi:clock-outline", 17)} Actualizado</span>
            </div>

            ${alerts.length ? this._renderCompactAlerts(state, alerts) : this._renderClearState()}
          </div>
        </div>
      </ha-card>`;
  }

  _renderCompactAlerts(state, alerts) {
    return `<div class="compact-list">${alerts.map((alert) => {
      const level = this._normalizeLevel(alert, state);
      const info = this._levelInfo(level);
      const type = this._getPhenomenonType(alert);
      return `
        <div class="compact-alert" style="--alert-color:${info.color}">
          <div class="compact-alert-icon">${this._phenomenonIcon(type, 27)}</div>
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
    const primary = alerts[0];
    const primaryType = primary ? this._getPhenomenonType(primary) : "weather";
    const primaryLevel = primary ? this._normalizeLevel(primary, state) : "none";
    const info = this._levelInfo(primaryLevel);

    return `
      ${this._styles()}
      <ha-card>
        <div class="premium-card detailed-card" style="--aemet-accent:${info.color}">
          ${this._weatherScene(primaryType, primaryLevel)}
          <div class="card-content">
            <div class="detail-header">
              <div class="brand-row">
                <div class="brand-icon">${this._icon(info.icon, 27)}</div>
                <div class="title-wrap">
                  <div class="eyebrow">AEMET · ALERTA ACTIVA</div>
                  <div class="title">${this._escape(area)}</div>
                </div>
              </div>
              <div class="count-badge">${alerts.length} activo${alerts.length === 1 ? "" : "s"}</div>
            </div>

            ${alerts.length ? alerts.map((alert) => this._renderDetailAlert(state, alert)).join("") : this._renderClearState()}
          </div>
        </div>
      </ha-card>`;
  }

  _renderDetailAlert(state, alert) {
    const level = this._normalizeLevel(alert, state);
    const info = this._levelInfo(level);
    const source = alert.source_url || alert.source || "";
    const type = this._getPhenomenonType(alert);
    const parameter = this._getParameter(alert);

    return `
      <section class="detail-alert" style="--alert-color:${info.color}">
        <div class="detail-visual">
          ${this._weatherScene(type, level, true)}
          <div class="detail-icon-large">${this._phenomenonIcon(type, 55)}</div>
          <span class="level-chip">${this._escape(info.label)}</span>
        </div>
        <div class="detail-main">
          <div class="detail-title-row">
            <div class="detail-title-wrap">
              <div class="detail-title">${this._escape(this._getPhenomenon(alert))}</div>
              <div class="detail-headline">${this._escape(alert.headline || alert.event || "Aviso meteorológico")}</div>
            </div>
          </div>

          <div class="metrics">
            ${this._metric(this._metricIcon(type), "Parámetro", parameter)}
            ${this._metric("mdi:percent", "Probabilidad", this._formatProbability(alert.probability))}
            ${this._metric("mdi:alert-circle-outline", "Severidad", alert.severity || "—")}
            ${this._metric("mdi:clock-alert-outline", "Urgencia", alert.urgency || "—")}
            ${this._metric("mdi:shield-check-outline", "Certeza", alert.certainty || "—")}
            ${this._metric("mdi:map-marker-outline", "Zona", alert.area_desc || state.attributes?.area || "—")}
          </div>

          <div class="times">
            <div><span>${this._icon("mdi:play-circle-outline", 16)} Inicio</span><strong>${this._formatDate(alert.onset || alert.effective)}</strong></div>
            <div><span>${this._icon("mdi:stop-circle-outline", 16)} Fin</span><strong>${this._formatDate(alert.expires)}</strong></div>
          </div>

          ${alert.description ? `<div class="text-block"><strong>Descripción</strong><p>${this._escape(alert.description)}</p></div>` : ""}
          ${alert.instruction ? `<div class="text-block recommendation"><strong>Recomendación</strong><p>${this._escape(alert.instruction)}</p></div>` : ""}
          ${source ? `<a class="source" href="${this._escape(source)}" target="_blank" rel="noopener">${this._icon("mdi:open-in-new", 17)} Ver aviso oficial en AEMET</a>` : ""}
        </div>
      </section>`;
  }

  _metric(icon, label, value) {
    return `<div class="metric"><div class="metric-icon">${this._icon(icon, 18)}</div><div><small>${this._escape(label)}</small><span>${this._escape(value)}</span></div></div>`;
  }

  _metricIcon(type) {
    const icons = {
      rain: "mdi:weather-rainy",
      storm: "mdi:weather-lightning",
      wind: "mdi:weather-windy",
      snow: "mdi:weather-snowy-heavy",
      fog: "mdi:weather-fog",
      waves: "mdi:waves",
      heat: "mdi:thermometer-high",
      dust: "mdi:weather-dust",
      weather: "mdi:weather-partly-cloudy",
    };
    return icons[type] || icons.weather;
  }

  _phenomenonIcon(type, size = 48) {
    const icons = {
      rain: "mdi:weather-pouring",
      storm: "mdi:weather-lightning",
      wind: "mdi:weather-windy",
      snow: "mdi:weather-snowy-heavy",
      fog: "mdi:weather-fog",
      waves: "mdi:waves",
      heat: "mdi:white-balance-sunny",
      dust: "mdi:weather-dust",
      weather: "mdi:weather-partly-cloudy",
    };
    return `<div class="phenomenon-icon icon-${type}">${this._icon(icons[type] || icons.weather, size)}</div>`;
  }

  _weatherScene(type, level, subtle = false) {
    const intensity = level === "red" ? "intense" : level === "orange" ? "strong" : "soft";
    const cls = `weather-scene scene-${type} ${intensity}${subtle ? " subtle" : ""}`;

    const drops = Array.from({ length: 14 }, (_, i) => `<i class="rain-drop d${i + 1}"></i>`).join("");
    const snow = Array.from({ length: 11 }, (_, i) => `<i class="snow-flake s${i + 1}">✦</i>`).join("");
    const wind = Array.from({ length: 6 }, (_, i) => `<i class="wind-line w${i + 1}"></i>`).join("");
    const waves = `<i class="wave wave1"></i><i class="wave wave2"></i><i class="wave wave3"></i>`;
    const fog = `<i class="fog-layer f1"></i><i class="fog-layer f2"></i><i class="fog-layer f3"></i>`;
    const dust = Array.from({ length: 9 }, (_, i) => `<i class="dust-particle p${i + 1}"></i>`).join("");

    const content = {
      rain: `<div class="cloud cloud-main"></div><div class="cloud cloud-back"></div>${drops}`,
      storm: `<div class="cloud cloud-main"></div><div class="cloud cloud-back"></div>${drops}<i class="lightning-bolt"></i>`,
      wind: `<div class="wind-cloud"></div>${wind}`,
      snow: `<div class="cloud cloud-main"></div>${snow}`,
      fog,
      waves,
      heat: `<div class="heat-sun"></div><i class="heat-wave h1"></i><i class="heat-wave h2"></i><i class="heat-wave h3"></i>`,
      dust: `<div class="dust-haze"></div>${dust}`,
      weather: `<div class="sun-glow"></div><div class="soft-cloud"></div>`,
    };

    return `<div class="${cls}" aria-hidden="true">${content[type] || content.weather}</div>`;
  }

  _getParameter(alert) {
    if (alert?.parameter) return alert.parameter;
    return alert?.description || "";
  }

  _getSummary(alerts) {
    if (!alerts.length) return "Condiciones estables · sin avisos activos";
    const phenomena = [...new Set(alerts.map((a) => this._getPhenomenon(a)).filter(Boolean))];
    return phenomena.slice(0, 2).join(" · ") || "Avisos activos";
  }

  _renderClearState() {
    return `
      <div class="clear-state">
        <div class="clear-icon">${this._phenomenonIcon("weather", 42)}</div>
        <div><strong>Sin avisos activos</strong><span>No hay avisos meteorológicos activos en esta zona.</span></div>
      </div>`;
  }

  _error(message) {
    return `<ha-card><div class="error">${this._icon("mdi:alert-circle", 22)} ${this._escape(message)}</div></ha-card>`;
  }

  _styles() {
    return `<style>
      :host { display:block; }
      ha-card { overflow:hidden; border-radius:20px; }
      .premium-card { position:relative; overflow:hidden; isolation:isolate; background:linear-gradient(145deg, color-mix(in srgb, var(--card-background-color, #111827) 94%, var(--aemet-accent) 6%), var(--card-background-color, #111827)); }
      .premium-card::before { content:""; position:absolute; inset:0; z-index:-1; background:radial-gradient(circle at 85% 12%, color-mix(in srgb, var(--aemet-accent) 18%, transparent), transparent 35%), radial-gradient(circle at 15% 100%, color-mix(in srgb, var(--aemet-accent) 10%, transparent), transparent 40%); pointer-events:none; }
      .card-content { position:relative; z-index:2; padding:18px; }
      .compact-top, .detail-header, .brand-row, .hero-row, .status-strip, .detail-title-row, .times, .clear-state { display:flex; }
      .compact-top, .detail-header { align-items:center; justify-content:space-between; gap:12px; }
      .brand-row { align-items:center; gap:11px; min-width:0; }
      .brand-icon { width:44px; height:44px; border-radius:14px; display:flex; align-items:center; justify-content:center; color:var(--aemet-accent); background:color-mix(in srgb, var(--aemet-accent) 14%, transparent); box-shadow:0 0 25px color-mix(in srgb, var(--aemet-accent) 16%, transparent); flex:0 0 44px; }
      .title-wrap { min-width:0; }
      .eyebrow { font-size:9px; letter-spacing:.16em; font-weight:800; color:var(--secondary-text-color); opacity:.8; text-transform:uppercase; }
      .title { margin-top:2px; font-size:18px; font-weight:750; line-height:1.2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .level-badge, .count-badge, .level-chip { border:1px solid color-mix(in srgb, var(--aemet-accent) 35%, transparent); color:var(--aemet-accent); background:color-mix(in srgb, var(--aemet-accent) 13%, transparent); border-radius:999px; padding:7px 10px; font-size:10px; font-weight:800; white-space:nowrap; text-transform:uppercase; letter-spacing:.04em; }
      .hero-row { min-height:115px; align-items:center; justify-content:space-between; gap:12px; padding:14px 0 8px; }
      .hero-phenomenon { font-size:24px; font-weight:800; line-height:1.05; max-width:75%; }
      .hero-summary { margin-top:7px; color:var(--secondary-text-color); font-size:12px; max-width:70%; }
      .hero-icon { width:90px; height:90px; display:flex; align-items:center; justify-content:center; color:var(--aemet-accent); filter:drop-shadow(0 0 18px color-mix(in srgb, var(--aemet-accent) 22%, transparent)); }
      .hero-icon .phenomenon-icon { transform:scale(1.05); }
      .status-strip { align-items:center; justify-content:space-between; gap:10px; padding:9px 0 13px; color:var(--secondary-text-color); font-size:11px; border-bottom:1px solid color-mix(in srgb, var(--divider-color) 60%, transparent); }
      .status-strip span { display:flex; align-items:center; gap:5px; }
      .compact-list { display:grid; gap:8px; padding-top:12px; }
      .compact-alert { display:flex; align-items:center; gap:11px; padding:11px; border:1px solid color-mix(in srgb, var(--alert-color) 16%, var(--divider-color)); border-radius:14px; background:color-mix(in srgb, var(--secondary-background-color) 82%, var(--alert-color) 18%); transition:transform .25s ease, box-shadow .25s ease; }
      .compact-alert:hover { transform:translateY(-1px); box-shadow:0 8px 22px color-mix(in srgb, var(--alert-color) 12%, transparent); }
      .compact-alert-icon { width:40px; height:40px; display:flex; align-items:center; justify-content:center; border-radius:12px; color:var(--alert-color); background:color-mix(in srgb, var(--alert-color) 13%, transparent); flex:0 0 40px; }
      .alert-content { flex:1; min-width:0; }
      .alert-title { font-size:13px; font-weight:700; }
      .alert-meta { display:flex; flex-wrap:wrap; gap:7px; margin-top:4px; color:var(--secondary-text-color); font-size:10px; }
      .alert-level { color:var(--alert-color); font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:.08em; }
      .detailed-card .card-content { padding:18px; }
      .detail-header { padding-bottom:13px; border-bottom:1px solid color-mix(in srgb, var(--divider-color) 60%, transparent); }
      .count-badge { color:var(--secondary-text-color); border-color:var(--divider-color); background:var(--secondary-background-color); text-transform:none; letter-spacing:0; }
      .detail-alert { position:relative; display:grid; grid-template-columns:150px minmax(0,1fr); margin-top:14px; border:1px solid color-mix(in srgb, var(--alert-color) 22%, var(--divider-color)); border-radius:17px; overflow:hidden; background:color-mix(in srgb, var(--card-background-color, #111827) 92%, var(--alert-color) 8%); box-shadow:0 10px 30px rgba(0,0,0,.08); }
      .detail-visual { position:relative; min-height:185px; display:flex; align-items:center; justify-content:center; overflow:hidden; background:linear-gradient(145deg, color-mix(in srgb, var(--alert-color) 12%, transparent), transparent); }
      .detail-visual .weather-scene { opacity:.85; }
      .detail-icon-large { position:relative; z-index:3; color:var(--alert-color); filter:drop-shadow(0 0 16px color-mix(in srgb, var(--alert-color) 35%, transparent)); }
      .detail-visual .level-chip { position:absolute; z-index:4; top:10px; left:10px; --aemet-accent:var(--alert-color); }
      .detail-main { padding:17px; min-width:0; }
      .detail-title-row { align-items:flex-start; gap:10px; }
      .detail-title-wrap { min-width:0; }
      .detail-title { font-size:18px; font-weight:800; line-height:1.2; }
      .detail-headline { margin-top:4px; color:var(--secondary-text-color); font-size:11px; line-height:1.4; }
      .metrics { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:7px; margin-top:13px; }
      .metric { display:flex; align-items:center; gap:7px; min-width:0; padding:8px; border-radius:11px; background:var(--secondary-background-color); }
      .metric-icon { color:var(--alert-color); flex:0 0 auto; }
      .metric > div:last-child { min-width:0; }
      .metric small { display:block; color:var(--secondary-text-color); font-size:8px; text-transform:uppercase; letter-spacing:.07em; }
      .metric span { display:block; margin-top:2px; font-size:10px; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .times { gap:8px; margin-top:9px; }
      .times > div { flex:1; display:flex; align-items:center; justify-content:space-between; gap:8px; padding:8px 10px; border-radius:10px; background:color-mix(in srgb, var(--secondary-background-color) 75%, var(--alert-color) 25%); font-size:10px; }
      .times span { display:flex; align-items:center; gap:4px; color:var(--secondary-text-color); }
      .times strong { font-size:10px; }
      .text-block { margin-top:11px; padding-top:10px; border-top:1px solid color-mix(in srgb, var(--divider-color) 70%, transparent); }
      .text-block strong { font-size:10px; text-transform:uppercase; letter-spacing:.08em; }
      .text-block p { margin:5px 0 0; color:var(--secondary-text-color); font-size:11px; line-height:1.45; }
      .recommendation { border-left:3px solid var(--alert-color); padding-left:10px; }
      .source { display:inline-flex; align-items:center; gap:6px; margin-top:13px; padding:8px 10px; border-radius:10px; color:var(--alert-color); background:color-mix(in srgb, var(--alert-color) 10%, transparent); text-decoration:none; font-size:10px; font-weight:800; }
      .source:hover { background:color-mix(in srgb, var(--alert-color) 16%, transparent); }
      .clear-state { align-items:center; gap:12px; padding:18px 2px 3px; color:var(--secondary-text-color); }
      .clear-state strong, .clear-state span { display:block; }
      .clear-state strong { color:var(--primary-text-color); font-size:14px; }
      .clear-state span { margin-top:3px; font-size:11px; }
      .clear-icon { color:#f5b942; }
      .error { display:flex; align-items:center; gap:8px; padding:16px; color:var(--error-color); }

      /* Animated weather scenes */
      .weather-scene { position:absolute; inset:0; overflow:hidden; pointer-events:none; opacity:.72; }
      .weather-scene.subtle { opacity:.42; }
      .cloud, .soft-cloud, .wind-cloud { position:absolute; border-radius:999px; background:linear-gradient(180deg, color-mix(in srgb, var(--aemet-accent) 45%, white 55%), color-mix(in srgb, var(--aemet-accent) 18%, #64748b 82%)); filter:blur(.2px); box-shadow:0 12px 28px color-mix(in srgb, var(--aemet-accent) 12%, transparent); }
      .cloud::before, .cloud::after { content:""; position:absolute; border-radius:50%; background:inherit; }
      .cloud-main { width:90px; height:28px; right:14px; top:25px; animation:cloudFloat 7s ease-in-out infinite; }
      .cloud-main::before { width:40px; height:40px; left:14px; bottom:6px; }
      .cloud-main::after { width:51px; height:51px; right:12px; bottom:4px; }
      .cloud-back { width:72px; height:21px; right:80px; top:46px; opacity:.4; transform:scale(.8); animation:cloudFloat 10s ease-in-out -2s infinite reverse; }
      .cloud-back::before { width:32px; height:32px; left:10px; bottom:4px; }
      .cloud-back::after { width:38px; height:38px; right:10px; bottom:3px; }
      .rain-drop { position:absolute; width:2px; height:17px; border-radius:999px; background:linear-gradient(180deg, transparent, color-mix(in srgb, var(--aemet-accent) 75%, #bfe8ff 25%)); transform:rotate(16deg); animation:rainFall 1.15s linear infinite; opacity:.65; }
      .rain-drop.d1{left:58%;top:10%;animation-delay:-.8s}.rain-drop.d2{left:64%;top:0;animation-delay:-.2s}.rain-drop.d3{left:70%;top:24%;animation-delay:-.55s}.rain-drop.d4{left:76%;top:8%;animation-delay:-.1s}.rain-drop.d5{left:82%;top:32%;animation-delay:-.7s}.rain-drop.d6{left:88%;top:16%;animation-delay:-.4s}.rain-drop.d7{left:62%;top:42%;animation-delay:-.9s}.rain-drop.d8{left:73%;top:52%;animation-delay:-.35s}.rain-drop.d9{left:84%;top:48%;animation-delay:-.6s}.rain-drop.d10{left:92%;top:42%;animation-delay:-.15s}.rain-drop.d11{left:67%;top:67%;animation-delay:-.75s}.rain-drop.d12{left:79%;top:72%;animation-delay:-.45s}.rain-drop.d13{left:89%;top:61%;animation-delay:-.05s}.rain-drop.d14{left:57%;top:58%;animation-delay:-.3s}
      .scene-rain .rain-drop, .scene-storm .rain-drop { animation-duration:1.15s; }
      .scene-storm .rain-drop { animation-duration:.72s; }
      .lightning-bolt { position:absolute; right:31%; top:48%; width:7px; height:34px; background:#fff7b2; clip-path:polygon(55% 0,100% 0,65% 42%,100% 42%,25% 100%,42% 55%,0 55%); filter:drop-shadow(0 0 12px #fff2a6); opacity:0; animation:lightningFlash 4.8s infinite; }
      .wind-cloud { width:80px; height:23px; right:16px; top:27px; opacity:.65; animation:cloudFloat 8s ease-in-out infinite; }
      .wind-line { position:absolute; height:2px; border-radius:999px; background:color-mix(in srgb, var(--aemet-accent) 65%, white 35%); left:-30%; animation:windSweep 2.8s linear infinite; opacity:.7; }
      .wind-line.w1{top:25%;width:70%;animation-delay:-.2s}.wind-line.w2{top:36%;width:45%;animation-delay:-1.1s}.wind-line.w3{top:48%;width:80%;animation-delay:-1.8s}.wind-line.w4{top:61%;width:55%;animation-delay:-.7s}.wind-line.w5{top:72%;width:75%;animation-delay:-2.3s}.wind-line.w6{top:84%;width:42%;animation-delay:-1.5s}
      .snow-flake { position:absolute; color:#e8f5ff; font-size:12px; text-shadow:0 0 8px rgba(255,255,255,.8); animation:snowFall 4.5s linear infinite; }
      .snow-flake.s1{left:10%;top:-5%;animation-delay:-1s}.snow-flake.s2{left:22%;top:10%;animation-delay:-3s}.snow-flake.s3{left:36%;top:-8%;animation-delay:-2s}.snow-flake.s4{left:51%;top:5%;animation-delay:-4s}.snow-flake.s5{left:66%;top:-4%;animation-delay:-.5s}.snow-flake.s6{left:79%;top:14%;animation-delay:-2.5s}.snow-flake.s7{left:90%;top:-10%;animation-delay:-3.5s}.snow-flake.s8{left:43%;top:20%;animation-delay:-1.7s}.snow-flake.s9{left:72%;top:28%;animation-delay:-3.7s}.snow-flake.s10{left:16%;top:32%;animation-delay:-.7s}.snow-flake.s11{left:58%;top:30%;animation-delay:-2.8s}
      .wave { position:absolute; width:150%; height:45px; left:-25%; border:2px solid color-mix(in srgb, var(--aemet-accent) 60%, #9ed9ff 40%); border-left-color:transparent; border-right-color:transparent; border-radius:50%; animation:waveMove 4s ease-in-out infinite; opacity:.65; }
      .wave1{bottom:15%;}.wave2{bottom:30%;animation-delay:-1.2s;opacity:.45}.wave3{bottom:45%;animation-delay:-2.4s;opacity:.3}
      .fog-layer { position:absolute; width:150%; height:32px; left:-25%; border-radius:50%; background:color-mix(in srgb, var(--aemet-accent) 15%, white 85%); filter:blur(7px); animation:fogMove 8s ease-in-out infinite; opacity:.42; }.f1{top:28%}.f2{top:48%;animation-delay:-3s}.f3{top:67%;animation-delay:-5s}
      .heat-sun, .sun-glow { position:absolute; width:54px; height:54px; border-radius:50%; right:22%; top:20%; background:#ffd76a; box-shadow:0 0 35px #ffc83d,0 0 75px color-mix(in srgb, var(--aemet-accent) 35%, transparent); animation:sunPulse 3.2s ease-in-out infinite; }
      .heat-wave { position:absolute; bottom:18%; width:3px; height:42%; border-radius:50%; border-left:2px solid color-mix(in srgb, var(--aemet-accent) 60%, white 40%); filter:blur(1px); animation:heatWave 2.4s ease-in-out infinite; }.h1{left:28%}.h2{left:48%;animation-delay:-.8s}.h3{left:68%;animation-delay:-1.6s}
      .dust-haze { position:absolute; inset:20% -10%; background:linear-gradient(90deg,transparent,color-mix(in srgb, #c9a56a 25%, transparent),transparent); filter:blur(10px); animation:dustMove 6s ease-in-out infinite; }.dust-particle{position:absolute;width:3px;height:3px;border-radius:50%;background:#d5b477;animation:dustFloat 3.5s ease-in-out infinite}.p1{left:8%;top:40%}.p2{left:18%;top:60%;animation-delay:-1s}.p3{left:32%;top:30%;animation-delay:-2s}.p4{left:46%;top:72%;animation-delay:-.5s}.p5{left:58%;top:43%;animation-delay:-1.7s}.p6{left:70%;top:62%;animation-delay:-2.6s}.p7{left:82%;top:34%;animation-delay:-.9s}.p8{left:91%;top:70%;animation-delay:-2.2s}.p9{left:38%;top:53%;animation-delay:-3s}
      .soft-cloud { width:90px; height:28px; right:15%; top:30%; opacity:.42; animation:cloudFloat 9s ease-in-out infinite; }
      .sun-glow { width:48px; height:48px; opacity:.75; }
      .scene-weather .soft-cloud::before, .scene-weather .soft-cloud::after { content:""; position:absolute; border-radius:50%; background:inherit; }.scene-weather .soft-cloud::before{width:38px;height:38px;left:14px;bottom:5px}.scene-weather .soft-cloud::after{width:45px;height:45px;right:10px;bottom:3px}

      .icon-rain ha-icon { animation:iconBob 2.6s ease-in-out infinite; }
      .icon-storm ha-icon { animation:iconStorm 2.5s ease-in-out infinite; }
      .icon-wind ha-icon { animation:iconWind 2.2s ease-in-out infinite; }
      .icon-snow ha-icon { animation:iconSnow 3.2s ease-in-out infinite; }
      .icon-fog ha-icon { animation:iconFog 3.8s ease-in-out infinite; }
      .icon-waves ha-icon { animation:iconWave 2.6s ease-in-out infinite; }
      .icon-heat ha-icon { animation:iconHeat 2.8s ease-in-out infinite; }

      @keyframes rainFall { 0%{transform:translate3d(-5px,-35px,0) rotate(16deg);opacity:0} 15%{opacity:.7} 100%{transform:translate3d(10px,150px,0) rotate(16deg);opacity:0} }
      @keyframes lightningFlash { 0%,43%,46%,100%{opacity:0} 44%,45%{opacity:1} }
      @keyframes cloudFloat { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-12px)} }
      @keyframes windSweep { 0%{transform:translateX(0);opacity:0} 15%{opacity:.7} 85%{opacity:.7} 100%{transform:translateX(145%);opacity:0} }
      @keyframes snowFall { 0%{transform:translate3d(0,-25px,0) rotate(0);opacity:0} 12%{opacity:.85} 100%{transform:translate3d(18px,180px,0) rotate(220deg);opacity:0} }
      @keyframes waveMove { 0%,100%{transform:translateX(-4%) scaleY(.9)} 50%{transform:translateX(4%) scaleY(1.08)} }
      @keyframes fogMove { 0%,100%{transform:translateX(-5%)} 50%{transform:translateX(8%)} }
      @keyframes sunPulse { 0%,100%{transform:scale(.95);opacity:.75} 50%{transform:scale(1.08);opacity:1} }
      @keyframes heatWave { 0%,100%{transform:skewX(-8deg) scaleY(.9);opacity:.25} 50%{transform:skewX(8deg) scaleY(1.1);opacity:.75} }
      @keyframes dustMove { 0%,100%{transform:translateX(-8%)} 50%{transform:translateX(8%)} }
      @keyframes dustFloat { 0%,100%{transform:translate(0,0);opacity:.2} 50%{transform:translate(15px,-10px);opacity:.75} }
      @keyframes iconBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(3px)} }
      @keyframes iconStorm { 0%,70%,100%{transform:translateY(0) scale(1)} 74%{transform:translateY(-2px) scale(1.08)} 78%{transform:translateY(1px) scale(.98)} }
      @keyframes iconWind { 0%,100%{transform:translateX(0)} 50%{transform:translateX(5px)} }
      @keyframes iconSnow { 0%,100%{transform:translateY(0) rotate(-4deg)} 50%{transform:translateY(3px) rotate(4deg)} }
      @keyframes iconFog { 0%,100%{transform:translateX(-2px)} 50%{transform:translateX(3px)} }
      @keyframes iconWave { 0%,100%{transform:translateY(1px)} 50%{transform:translateY(-3px)} }
      @keyframes iconHeat { 0%,100%{transform:scale(1) rotate(-2deg)} 50%{transform:scale(1.05) rotate(2deg)} }

      @media (max-width: 600px) {
        .card-content { padding:14px; }
        .hero-phenomenon { font-size:20px; }
        .hero-icon { width:72px; height:72px; }
        .metrics { grid-template-columns:repeat(2,minmax(0,1fr)); }
        .detail-alert { grid-template-columns:1fr; }
        .detail-visual { min-height:110px; }
        .detail-icon-large { margin-top:16px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .weather-scene *, .phenomenon-icon *, .compact-alert { animation:none !important; transition:none !important; }
      }
    </style>`;
  }
}

if (!customElements.get("aemet-alertas-card")) {
  customElements.define("aemet-alertas-card", AemetAlertasCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "aemet-alertas-card",
  name: "AEMET Alertas",
  description: "Premium animated weather alert card for AEMET Alertas.",
  preview: true,
});
