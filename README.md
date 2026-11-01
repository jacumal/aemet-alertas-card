<div align="center">

# 🌦️ AEMET Alertas Card

**Tarjeta Lovelace para visualizar los avisos meteorológicos de AEMET en Home Assistant.**

[![Validate with HACS](https://github.com/jacumal/aemet-alertas-card/actions/workflows/hacs.yaml/badge.svg)](https://github.com/jacumal/aemet-alertas-card/actions/workflows/hacs.yaml)
[![Latest release](https://img.shields.io/github/v/release/jacumal/aemet-alertas-card?style=flat-square&label=release)](https://github.com/jacumal/aemet-alertas-card/releases)
[![License](https://img.shields.io/github/license/jacumal/aemet-alertas-card?style=flat-square)](LICENSE)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Lovelace%20Card-41BDF5?style=flat-square&logo=home-assistant&logoColor=white)](https://www.home-assistant.io/)

</div>

---

## ✨ ¿Qué es?

**AEMET Alertas Card** es una tarjeta personalizada de Lovelace diseñada para trabajar con la integración [AEMET Alertas](https://github.com/jacumal/aemet-alertas).

Permite presentar los avisos meteorológicos activos de una zona de Home Assistant de una forma clara, visual y adaptada tanto a móvil como a escritorio.

> **Importante:** este proyecto es independiente y **no está afiliado, patrocinado, respaldado ni mantenido por AEMET**.

## 🎨 Características

- 🟡🟠🔴 **Colores dinámicos** según el nivel del aviso.
- 📋 **Modo compacto** para el dashboard principal.
- 🔎 **Modo detallado** con toda la información relevante del aviso.
- 🔄 **Modo automático**: detallado cuando existen avisos y compacto cuando no los hay.
- 🌧️ Soporte para **múltiples avisos activos**.
- 📱 Diseño **responsive** para móvil y escritorio.
- 🌙 Compatible con los temas claro y oscuro de Home Assistant.
- 🧩 Sin dependencias externas ni Browser Mod.
- 🧭 Enlace directo al aviso publicado por AEMET cuando está disponible.
- 🧱 Selector de tarjeta de Home Assistant mediante `window.customCards`.

---

## 🚀 Instalación con HACS

La tarjeta está preparada como repositorio **Dashboard** de HACS.

### Repositorio personalizado

Mientras el repositorio no forme parte del catálogo predeterminado de HACS:

1. Abre **HACS**.
2. Entra en **Dashboard**.
3. Abre el menú **⋮ → Repositorios personalizados**.
4. Añade:

   `https://github.com/jacumal/aemet-alertas-card`

5. Selecciona la categoría **Dashboard**.
6. Instala **AEMET Alertas Card**.
7. Reinicia o recarga los recursos del frontend si Home Assistant lo solicita.

HACS gestiona el recurso JavaScript automáticamente.

---

## 🧩 Requisitos

Necesitas:

- Home Assistant.
- HACS.
- La integración **[AEMET Alertas](https://github.com/jacumal/aemet-alertas)** instalada y configurada.

La tarjeta no obtiene datos directamente de AEMET: utiliza los atributos de la entidad proporcionada por la integración.

---

## ⚙️ Configuración

### Modo compacto

Ideal para la pantalla principal del dashboard:

```yaml
type: custom:aemet-alertas-card
entity: sensor.alertas_amarillas_litoral_norte_de_valencia
mode: compact
```

Muestra el nivel, la zona, el número de avisos y un resumen de los fenómenos activos.

### Modo detallado

Para una vista meteorológica específica:

```yaml
type: custom:aemet-alertas-card
entity: sensor.alertas_amarillas_litoral_norte_de_valencia
mode: detailed
```

Incluye, cuando están disponibles:

- Fenómeno.
- Zona.
- Parámetro.
- Probabilidad.
- Severidad.
- Urgencia.
- Certeza.
- Inicio y finalización.
- Descripción.
- Recomendaciones.
- Enlace al aviso de AEMET.

### Modo automático

```yaml
type: custom:aemet-alertas-card
entity: sensor.alertas_amarillas_litoral_norte_de_valencia
mode: auto
```

Con `auto`, la tarjeta utiliza el modo detallado cuando existen avisos activos y muestra un estado limpio cuando no hay avisos.

### Mostrar el estado sin avisos

Por defecto, la tarjeta se muestra aunque no existan avisos. Puedes ocultarla completamente con:

```yaml
type: custom:aemet-alertas-card
entity: sensor.alertas_amarillas_litoral_norte_de_valencia
mode: compact
show_when_clear: false
```

### Limitar el número de avisos

```yaml
type: custom:aemet-alertas-card
entity: sensor.alertas_amarillas_litoral_norte_de_valencia
mode: detailed
max_alerts: 3
```

El valor predeterminado es `5`.

---

## 🟢🟡🟠🔴 Niveles de aviso

La tarjeta interpreta los niveles proporcionados por AEMET Alertas:

| Nivel | Presentación |
|---|---|
| 🟢 Verde | Sin riesgo meteorológico relevante |
| 🟡 Amarillo | Aviso amarillo |
| 🟠 Naranja | Aviso naranja |
| 🔴 Rojo | Aviso rojo |

El nivel se obtiene de los datos del aviso y se utiliza para adaptar automáticamente la interfaz.

---

## 📱 Diseño responsive

La tarjeta adapta su distribución al espacio disponible y está pensada para funcionar correctamente en:

- Ordenadores.
- Tablets.
- Smartphones.
- Dashboards en modo oscuro.
- Dashboards en modo claro.

No utiliza librerías JavaScript externas.

---

## 🧱 Estructura del repositorio

```text
.
├── aemet-alertas-card.js
├── hacs.json
├── README.md
└── LICENSE
```

El proyecto es deliberadamente sencillo: la tarjeta se distribuye como un único recurso JavaScript y no necesita proceso de compilación para su instalación.

---

## 🛠️ Desarrollo

El recurso principal es:

```text
aemet-alertas-card.js
```

La tarjeta utiliza APIs estándar del frontend de Home Assistant y Web Components nativos.

Para probar cambios localmente, carga el recurso JavaScript desde tu instancia de Home Assistant y actualiza el navegador después de modificarlo.

---

## ☕️ Apoya el proyecto

Si **AEMET Alertas Card** te resulta útil, puedes apoyar su desarrollo con un café:

<p align="center">
  <a href="https://www.buymeacoffee.com/jacumal">
    <img src="https://img.shields.io/badge/☕️%20Buy%20Me%20a%20Coffee-Apoyar%20el%20proyecto-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=000000" alt="Buy Me a Coffee">
  </a>
</p>

El apoyo es totalmente opcional y ayuda a mantener y mejorar el proyecto.

---

## ⚖️ Aviso legal

AEMET Alertas Card utiliza información proporcionada por la integración AEMET Alertas, cuyos datos proceden de los canales oficiales de AEMET.

**Este proyecto no es oficial de AEMET y no está afiliado, patrocinado, respaldado ni mantenido por AEMET.**

Consulta las condiciones de reutilización de AEMET antes de redistribuir o utilizar sus datos:

https://www.aemet.es/es/nota_legal

---

## 📄 Licencia

Este proyecto se distribuye bajo licencia **MIT**. Consulta [`LICENSE`](LICENSE) para más información.

## 👨‍💻 Créditos

Desarrollado por **Javi / [@jacumal](https://github.com/jacumal)** para la comunidad de Home Assistant.

---

<div align="center">

**AEMET Alertas Card · Home Assistant · Lovelace**

</div>
