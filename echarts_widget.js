// On crée le template HTML contenant uniquement le conteneur du graphique
const template = document.createElement("template");
template.innerHTML = `
    <div id="echarts-container" style="width: 100%; height: 100%; min-height: 350px;"></div>
`;

class EChartsWidget extends HTMLElement {
    constructor() {
        super();
        // Création du Shadow DOM pour isoler le rendu du graphique dans SAC
        this._shadowRoot = this.attachShadow({ mode: "open" });
        this._shadowRoot.appendChild(template.content.cloneNode(true));
        
        this._container = this._shadowRoot.getElementById("echarts-container");
        this._myChart = null;
        this._echartsLoaded = false;

        // Liaison de l'URL d'hébergement GitHub Pages ou CDN pour le suivi interne si nécessaire
        this._widgetUrl = "https://akken-perso.github.io/Custom_widget/echarts_widget.js";
    }

    // Cycle de vie SAC : Appelé quand le widget est ajouté sur le canevas de la Story
    connectedCallback() {
        this.loadEChartsLibrary();
    }

    // Chargement asynchrone et sécurisé de la bibliothèque Apache ECharts
    async loadEChartsLibrary() {
        if (typeof window.echarts !== "undefined" || this._echartsLoaded) {
            this._echartsLoaded = true;
            this.render();
            return;
        }

        try {
            // Importation dynamique de la dernière version stable d'ECharts depuis un CDN hautement disponible
            await import("https://cdnjs.cloudflare.com/ajax/libs/echarts/5.5.0/echarts.esm.min.js");
            this._echartsLoaded = true;
            this.render();
        } catch (error) {
            console.error("Erreur lors du chargement d'Apache ECharts depuis le CDN:", error);
            this._container.innerHTML = `<p style="color:red; padding:10px;">Échec du chargement d'ECharts : Vérifiez les Trusted Origins dans SAC.</p>`;
        }
    }

    // Cycle de vie SAC : Appelé automatiquement dès que les filtres ou les données SAP changent
    onCustomWidgetAfterUpdate(changedProperties) {
        if (this._echartsLoaded) {
            this.render();
        }
    }

    // Génération et mise à jour du graphique avec les flux de données réels
    render() {
        // Initialisation de l'instance de graphique sur le conteneur HTML si elle n'existe pas encore
        if (!this._myChart && window.echarts) {
            this._myChart = window.echarts.init(this._container);
        }

        if (!this._myChart) return;

        // Récupération du flux de données "dataBindings" défini par le JSON
        const dataBinding = this.dataBindings ? this.dataBindings.getDataBinding("data") : null;
        
        // Si aucune donnée n'est encore glissée-déposée dans le panneau Builder de SAC
        if (!dataBinding || !dataBinding.data || dataBinding.data.length === 0) {
            this._container.innerHTML = `
                <div style="display:flex; align-items:center; justify-content:center; height:100%; color:#666; font-family:sans-serif; text-align:center;">
                    Veuillez lier une Dimension et une Mesure dans le panneau de configuration SAC.
                </div>`;
            this._myChart = null; // Forcer la réinitialisation au prochain passage
            return;
        }

        // Nettoyage de l'affichage d'attente si les données viennent d'arriver
        if (this._container.querySelector('div')) {
            this._container.innerHTML = '';
            this._myChart = window.echarts.init(this._container);
        }

        const sapData = dataBinding.data;

        // Extraction dynamique des axes à partir du modèle SAP (S'adapte aux libellés de vos colonnes)
        const categories = sapData.map(row => row.dimensions[0].label); // Premier champ de dimension (Ex: Axe X / Temps)
        const values = sapData.map(row => row.measures[0].raw);       // Premier champ de mesure (Ex: Axe Y / Quantités)

        // Configuration d'affichage d'Apache ECharts (Personnalisable à l'infini)
        const option = {
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderWidth: 1,
                borderColor: '#ccc'
            },
            grid: {
                left: '8%',
                right: '5%',
                bottom: '10%',
                top: '12%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: categories,
                axisLine: { lineStyle: { color: '#999' } }
            },
            yAxis: {
                type: 'value',
                splitLine: { lineStyle: { type: 'dashed', color: '#eee' } },
                axisLine: { show: false }
            },
            series: [{
                name: dataBinding.metadata.feeds.measures.values[0] || 'Indicateur',
                data: values,
                type: 'line',
                smooth: true,                // Courbe lissée fluide (Inexistante en natif simple)
                symbolSize: 8,
                lineStyle: { width: 3, color: '#2b7cff' },
                itemStyle: { color: '#2b7cff' },
                areaStyle: {                 // Dégradé de couleur sous la courbe pour un effet "Aire moderne"
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(43, 124, 255, 0.4)' },
                            { offset: 1, color: 'rgba(43, 124, 255, 0.0)' }
                        ]
                    }
                }
            }]
        };

        // Rendu final
        this._myChart.setOption(option);
        
        // Écouteur pour adapter la taille du graphique si l'utilisateur redimensionne le widget dans la Story
        const resizeObserver = new ResizeObserver(() => {
            if (this._myChart) this._myChart.resize();
        });
        resizeObserver.observe(this);
    }
}

// Enregistrement du Web Component (Le tag doit correspondre exactement au JSON)
customElements.define("com-exemple-echarts-main", EChartsWidget);