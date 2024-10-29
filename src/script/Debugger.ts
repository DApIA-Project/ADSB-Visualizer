
import Chart from 'chart.js/auto';
import { FlightMap } from "./FlightMap";
import Flight from './Flight';


const baseColor = "#dfe6e9"
const secondaryColor = "#0984e3"
const bacgroundColor = "#8a8e90"

const max_lenght = 1*60; // 10 minutes


function make_chart(id, dataset, y_min?:number, y_max?:number):Chart{
    return new Chart(id, {
        type: 'line',
        data: {
            labels: [],
            datasets: dataset
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    ticks: {
                        callback: function(value, index, values) {
                            if (typeof value === 'number'){
                                return Math.floor(value);
                            }
                            return value;
                        }.bind(this),
                        color: baseColor,
                        font: {
                            size: 12,
                        },
                    },
                    grid: {
                        color: bacgroundColor,
                    },
                    bounds: 'data',
                    title: {
                        display: true,
                        text: 'Time (s)',
                        color: baseColor,
                        font: {
                            size: 12,
                        }
                    },
                    min:-max_lenght+1,
                    max:0,
                },
                y: {
                    ticks: {
                        color: baseColor,
                        font: {
                            size: 12,
                        },
                    },
                    grid: {
                        color: bacgroundColor,
                    },
                    min: y_min,
                    max: y_max,
                },
            },
            plugins: {
                legend: {
                    display: false,
                }
            },
            animation: {
                duration: 0,
            },

        }
    });
}



export class Debugger {

    private is_active:boolean = false;
    private is_open:boolean = false
    private map: FlightMap;
    private flight:Flight = undefined;
    private html:HTMLElement = undefined;


    private flooding_chart:Chart;
    private spoofing_chart:Chart;

    constructor() {
        this.init_flooding_chart();
        this.init_spoofing_chart();
        this.html = document.getElementById('window-flight-debug');
    }

    public setMap(map: FlightMap) {
        this.map = map;
    }


    public active(){
        this.is_active = true;
        this.map.debug_mode_changed();
    }

    public desactive(){
        this.is_active = false;
        this.map.debug_mode_changed();
    }

    public open(){
        if (!this.is_active)
            return;

        this.html.style.display = 'flex';
        this.is_open = true;
    }
    public close(){
        this.html.style.display = 'none';
        this.is_open = false;
    }

    public isActived(){
        return this.is_active;
    }
    public getFlight():Flight{
        return this.flight;
    }

    public displayFlight(flight:Flight){
        this.flight = flight;
        if (this.flight != undefined)
            this.open();
        else
            this.close();
    }

    public update(timestamp:number){
        console.log("update debugger");

        if (!this.is_open)
            return;

        this.update_flooding_chart(timestamp);
        this.update_spoofing_chart(timestamp);

    }


    private init_flooding_chart(){
        this.flooding_chart = make_chart('flooding-debug-graph', []);
    }

    private init_spoofing_chart(){
        let datasets = [];
        // colors are red, blue, yellow
        const colors = ["#e74c3c", "#3498db", "#f1c40f"];
        const labels = ["commertial", "tourims", "helicopter"];
        for (let i = 0; i < 3; i++) {
            datasets.push({
                label: labels[i],
                data: [],
                backgroundColor: colors[i],
                borderColor: colors[i],
                borderWidth: 2,
                pointRadius: 0,
                cubicInterpolationMode: 'monotone',
            });

        }
        this.spoofing_chart = make_chart('spoofing-debug-graph', datasets, 0, 1);
    }

    private update_flooding_chart(timestamp:number){
        const COLORS = ["#e74c3c", "#f39c12", "#2ecc71", "#3498db", "#9b59b6", "#34495e", "#16a085", ];

        // loss timeserie for sub-flights
        let sub_flights:{[key:string]:number[]} = {};
        let [a, b] = this.flight.getIndicesAtTimeRange(timestamp-max_lenght*2, timestamp);

        let flight_flooding_loss = this.flight.getDebugData("debug_flooding_loss").slice(a, b);
        let tags = this.flight.get("tag").slice(a, b);
        let ts_ = this.flight.get("time").slice(a, b);



        let unique_tags = Array.from(this.flight.unique_tag);
        unique_tags.sort();
        for (let tag of unique_tags) {
            sub_flights[tag] = [];
        }

        for (let i = 0; i < flight_flooding_loss.length; i++) {
            const tag = tags[i];
            sub_flights[tag].push(flight_flooding_loss[i]);
        }

        let max_length = 0;
        for (let tag in sub_flights) {
            if (sub_flights[tag].length > max_length)
                max_length = sub_flights[tag].length;
        }

        let ts = new Array(max_length).fill(undefined);
        let it = 0;
        for (let t = 1; t < ts_.length; t++) {
            if (ts_[t-1] != ts_[t])
                ts[it++] = ts_[t-1] - timestamp + 1;
        }
        ts[it] = ts_[ts_.length-1] - timestamp + 1;



        // draw one curve per sub-flight
        let labels = [];
        let data = [];
        let colors = [];
        let i = 0;
        for (let tag in sub_flights) {
            labels.push(tag);
            let sample = new Array(max_length).fill(undefined);
            let start = max_length - sub_flights[tag].length;
            for (let t = 0; t < sub_flights[tag].length; t++) {
                sample[start + t] = sub_flights[tag][t];
            }
            colors.push(COLORS[i % COLORS.length]);
            data.push(sample);
            i++;
        }

        this.flooding_chart.data.labels = ts;
        this.flooding_chart.data.datasets = [];
        for (let i = 0; i < data.length; i++) {
            this.flooding_chart.data.datasets.push({
                label: labels[i],
                data: data[i],
                backgroundColor: colors[i],
                borderColor: colors[i],
                borderWidth: 2,
                pointRadius: 0,
                cubicInterpolationMode: 'monotone',
            });
        }

        this.flooding_chart.update();
    }




    private update_spoofing_chart(timestamp:number){
        const filter_tag = "0"
        let [a, b] = this.flight.getIndicesAtTimeRange(timestamp-max_lenght*2, timestamp);

        let flight_spoofing_proba = this.flight.getDebugData("debug_spoofing_proba").slice(a, b);
        let tags = this.flight.get("tag").slice(a, b);
        let ts_ = this.flight.get("time").slice(a, b);

        let data:[number[], number[], number[]] = [[], [], []];
        let ts = [];

        for (let i = 0; i < flight_spoofing_proba.length; i++) {
            if (tags[i] == filter_tag){
                console.log(flight_spoofing_proba[i]);
                if(flight_spoofing_proba[i]==undefined){
                    data[0].push(undefined);
                    data[1].push(undefined);
                    data[2].push(undefined);
                    ts.push(ts_[i] - timestamp + 1);
                }
                else if (flight_spoofing_proba[i][0] + flight_spoofing_proba[i][1] + flight_spoofing_proba[i][2] > 0)
                {
                    data[0].push(flight_spoofing_proba[i][0]);
                    data[1].push(flight_spoofing_proba[i][1]);
                    data[2].push(flight_spoofing_proba[i][2]);
                    ts.push(ts_[i] - timestamp + 2);
                }
                else{
                    data[0].push(data[0][data[0].length-1]);
                    data[1].push(data[1][data[1].length-1]);
                    data[2].push(data[2][data[2].length-1]);
                    ts.push(ts_[i] - timestamp + 2);
                }
            }
        }

        this.spoofing_chart.data.labels = ts;
        this.spoofing_chart.data.datasets[0].data = data[0];
        this.spoofing_chart.data.datasets[1].data = data[1];
        this.spoofing_chart.data.datasets[2].data = data[2];
        this.spoofing_chart.update();

    }

}