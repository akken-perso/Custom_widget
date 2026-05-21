// Définition du template HTML & CSS du widget
const template = document.createElement("template");
template.innerHTML = `
    <style>
        :host {
            display: block;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            width: 100%;
            height: 100%;
            overflow-y: auto;
        }
        .panel-container {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            padding: 10px;
            box-sizing: border-box;
        }
        .indicator-card {
            flex: 1 1 calc(25% - 15px); /* Donne un rendu de 4 cartes par ligne si l'espace le permet */
            min-width: 200px;
            background: #ffffff;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            padding: 15px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            box-sizing: border-box;
            transition: transform 0.2s;
        }
        .indicator-card:hover {
            transform: translateY(-2px);
        }
        .card-title {
            font-size: 0.9rem;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 8px;
            text-transform: uppercase;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .card-values {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
        }
        .value-actual {
            font-size: 1.8rem;
            font-weight: 700;
        }
        .value-target {
            font-size: 0.85rem;
            color: #94a3b8;
        }
        .status-badge {
            margin-top: 10px;
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: bold;
            color: #ffffff;
        }
        .empty-message {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            min-height: 150px;
            color: #64748b;
            font-style: italic;
            border: 2px dashed #cbd5e1;
            border-radius: 8px;
            background: #f8fafc;
        }
    </style>
    <div id="root-container" class="panel-container">
        <div class="empty-message">Veuillez lier un modèle, une dimension et au moins une mesure dans le panneau de configuration SAC.</div>
    </div>
`;

class LibrePanel extends HTMLElement {
    constructor() {
        super();
        // Création du Shadow DOM pour isoler le style du widget du reste de la Story SAC
        this._shadowRoot = this.attachShadow({ mode: "open" });
        this._shadowRoot.appendChild(template.content.cloneNode(true));
        
        this._container = this._shadowRoot.getElementById("root-container");
        
        // Récupération par défaut des couleurs définies dans les propriétés du JSON
        this._colorAbove = "#27AE60";
        this._colorBelow = "#C0392B";
    }

    // Cycle de vie SAC : Appelé automatiquement lorsque le widget reçoit des modifications (données, filtres, propriétés)
    onCustomWidgetAfterUpdate(changedProperties) {
        // Mise à jour dynamique des couleurs si elles ont été modifiées dans l'interface SAC
        if (changedProperties.colorAbove) this._colorAbove = changedProperties.colorAbove;
        if (changedProperties.colorBelow) this._colorBelow = changedProperties.colorBelow;

        this.renderDynamicData();
    }

    renderDynamicData() {
        // Accès au flux de données défini sous l'ID "dataStructurePerformance" du fichier JSON
        const binding = this.dataBindings ? this.dataBindings.getDataBinding("dataStructurePerformance") : null;
        
        // Sécurité : Si aucune donnée n'est envoyée ou si le chargement est en cours
        if (!binding || !binding.data || binding.data.length === 0) {
            this._container.innerHTML = `
                <div class="empty-message">
                    Abonnement aux données actif. Veuillez glisser une Dimension (ex: Atelier) et vos Mesures (Réel, Objectif) dans le panneau de droite.
                </div>`;
            return;
        }

        const rawRows = binding.data;
        this._container.innerHTML = ""; // On vide le conteneur pour reconstruire les éléments avec les nouvelles données

        // Boucle sur chaque ligne renvoyée dynamiquement par le modèle analytique SAC
        rawRows.forEach((row) => {
            // 1. Extraction du libellé de la première dimension sélectionnée (Axe X / Ligne / Atelier)
            const labelDimension = row.dimensions[0] && row.dimensions[0].label ? row.dimensions[0].label : "Indicateur sans nom";
            
            // 2. Extraction sécurisée de la première mesure (index 0 : Réel)
            const valeurReelle = row.measures[0] && row.measures[0].raw !== undefined ? row.measures[0].raw : null;
            const formatReelle = row.measures[0] && row.measures[0].formatted ? row.measures[0].formatted : "-";
            
            // 3. Extraction sécurisée de la seconde mesure (index 1 : Objectif)
            const valeurObjectif = row.measures[1] && row.measures[1].raw !== undefined ? row.measures[1].raw : null;
            const formatObjectif = row.measures[1] && row.measures[1].formatted ? row.measures[1].formatted : "-";

            // 4. Calcul de l'état de performance (Comparaison Réel vs Objectif)
            let statusText = "Pas d'objectif";
            let badgeColor = "#94a3b8"; // Gris par défaut

            if (valeurReelle !== null && valeurObjectif !== null) {
                if (valeurReelle >= valeurObjectif) {
                    statusText = "Objectif Atteint";
                    badgeColor = this._colorAbove; // Vert (ou couleur personnalisée)
                } else {
                    statusText = "En deçà du seuil";
                    badgeColor = this._colorBelow; // Rouge (ou couleur personnalisée)
                }
            }

            // 5. Génération dynamique du code HTML pour la ligne/carte courante
            const card = document.createElement("div");
            card.className = "indicator-card";
            card.innerHTML = `
                <div class="card-title" title="${labelDimension}">${labelDimension}</div>
                <div class="card-values">
                    <div class="value-actual" style="color: ${badgeColor};">${formatReelle}</div>
                    <div class="value-target">Obj: ${formatObjectif}</div>
                </div>
                <div class="status-badge" style="background-color: ${badgeColor};">
                    ${statusText}
                </div>
            `;
            
            this._container.appendChild(card);
        });
    }
}

// Enregistrement du Web Component (Le tag 'libre-panel' doit être identique à la propriété 'tag' du fichier JSON)
customElements.define("libre-panel", LibrePanel);