(function () {
  const template = document.createElement("template");
  template.innerHTML = `
    <style>
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      #chart-container {
        width: 100%;
        height: 100%;
        min-height: 200px;
      }
    </style>
    <div id="chart-container"></div>
  `;

  class GradeGauge extends HTMLElement {
    constructor() {
      super();
      this._shadowRoot = this.attachShadow({ mode: "open" });
      this._shadowRoot.appendChild(template.content.cloneNode(true));

      this._container = this._shadowRoot.getElementById("chart-container");
      this._chart = null;

      // Valeurs par défaut internes
      this._value = 0.7;
      this._title = "Grade Rating";
    }

    connectedCallback() {
      this.loadECharts();
    }

    disconnectedCallback() {
      if (this._chart) {
        this._chart.dispose();
      }
      window.removeEventListener("resize", this._resizeChart);
    }

    // Chargement dynamique d'ECharts pour éviter les conflits dans SAC
    loadECharts() {
      if (window.echarts) {
        this.initChart();
      } else {
        const script = document.createElement("script");
        script.src = "https://echarts.apache.org/en/js/vendors/echarts/dist/echarts.min.js";
        script.onload = () => this.initChart();
        document.head.appendChild(script);
      }
    }

    initChart() {
      this._chart = echarts.init(this._container, null, {
        renderer: "canvas",
        useDirtyRect: false,
      });

      this.render();

      // Gestion du redimensionnement automatique dans SAC
      this._resizeChart = () => {
        if (this._chart) this._chart.resize();
      };
      window.addEventListener("resize", this._resizeChart);
      
      // Observateur pour ajuster le graphique quand le conteneur change de taille dans SAC
      const resizeObserver = new ResizeObserver(() => this._resizeChart());
      resizeObserver.observe(this._container);
    }

    render() {
      if (!this._chart) return;

      const option = {
        series: [
          {
            type: "gauge",
            startAngle: 180,
            endAngle: 0,
            center: ["50%", "75%"],
            radius: "90%",
            min: 0,
            max: 1,
            splitNumber: 8,
            axisLine: {
              lineStyle: {
                width: 6,
                color: [
                  [0.25, "#FF6E76"],
                  [0.5, "#FDDD60"],
                  [0.75, "#58D9F9"],
                  [1, "#7CFFB2"],
                ],
              },
            },
            pointer: {
              icon: "path://M12.8,0.7l12,40.1H0.7L12.8,0.7z",
              length: "12%",
              width: 20,
              offsetCenter: [0, "-60%"],
              itemStyle: {
                color: "auto",
              },
            },
            axisTick: {
              length: 12,
              lineStyle: {
                color: "auto",
                width: 2,
              },
            },
            splitLine: {
              length: 20,
              lineStyle: {
                color: "auto",
                width: 5,
              },
            },
            axisLabel: {
              color: "#464646",
              fontSize: 14, // Légèrement réduit pour une meilleure intégration en tuile SAC
              distance: -60,
              rotate: "tangential",
              formatter: function (value) {
                if (value === 0.875) return "Grade A";
                if (value === 0.625) return "Grade B";
                if (value === 0.375) return "Grade C";
                if (value === 0.125) return "Grade D";
                return "";
              },
            },
            title: {
              offsetCenter: [0, "-10%"],
              fontSize: 16,
            },
            detail: {
              fontSize: 24,
              offsetCenter: [0, "-35%"],
              valueAnimation: true,
              formatter: function (value) {
                return Math.round(value * 100) + "";
              },
              color: "inherit",
            },
            data: [
              {
                value: this._value,
                name: this._title,
              },
            ],
          },
        ],
      };

      this._chart.setOption(option);
    }

    // Gestion des propriétés SAC (Getters / Setters)
    get value() {
      return this._value;
    }

    set value(val) {
      this._value = parseFloat(val);
      this.render();
    }

    get title() {
      return this._title;
    }

    set title(val) {
      this._title = val;
      this.render();
    }
  }

  customElements.define("acome-grade-gauge", GradeGauge);
})();