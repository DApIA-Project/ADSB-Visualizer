// @ts-nocheck
// forced to disable ts check because of 
// the chart.js library type definition wich is not up to date

import Chart from 'chart.js/auto';
import Flight from './Flight';
import { float_to_string } from './Utils';
import anime from 'animejs'


export class FlightInfoDisplayer{
    chart:Chart;
    time_unit:string = 's';
    flight:Flight = undefined;

    lasttimestamp:number = undefined;


    html:HTMLElement;

    callsign_html:HTMLElement;
    icao24_html:HTMLElement;
    velocity_html:HTMLElement;
    heading_html:HTMLElement;
    altitude_html:HTMLElement;
    vertical_rate_html:HTMLElement;
    on_ground_html:HTMLElement;
    squawk_html:HTMLElement;
    alert_html:HTMLElement;
    spi_html:HTMLElement;

    // select element
    variable_selecor_html:HTMLInputElement;
    window_lenght_html:HTMLInputElement;
    // close
    close_button_html:HTMLElement;



    constructor(){

        this.html = document.getElementById('window-flight-data');
        this.html.style.display = 'none';


        this.callsign_html = document.getElementById('data-callsign');
        this.icao24_html = document.getElementById('data-icao24');
        this.velocity_html = document.getElementById('data-velocity');
        this.heading_html = document.getElementById('data-heading');
        this.altitude_html = document.getElementById('data-altitude');
        this.vertical_rate_html = document.getElementById('data-vertical-rate');
        this.on_ground_html = document.getElementById('data-on-ground');
        this.squawk_html = document.getElementById('data-squawk');
        this.alert_html = document.getElementById('data-alert');
        this.spi_html = document.getElementById('data-spi');

        this.variable_selecor_html = document.getElementById('variable-selector') as HTMLInputElement;
        this.variable_selecor_html.addEventListener('change', () => {this.update(this.lasttimestamp);});
        this.window_lenght_html = document.getElementById('window-length') as HTMLInputElement;
        this.window_lenght_html.addEventListener('change', () => {this.changeSpeed();});

        this.close_button_html = document.getElementById('close-flight-data-btn');
        this.close_button_html.addEventListener('click', () => {this.close();});

        var baseColor = "#dfe6e9"
        var secondaryColor = "#0984e3"
        var bacgroundColor = "#8a8e90"


        // create a chart
        // labels: [0, 1, 2, 5, 6, 9, 10],
        // data: [5, 3, 7, 1, 2, 6, 5],
        //
        // texts should be baseColor
        // lines should be secondaryColor
        // background should be bacground1Color
        // grid should be bacground3Color
        // axis should be baseColor
        // legend should be hidden
        // axis should respect scale (linear)
        this.chart = new Chart('flight-data-graph', {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '',
                    data: [],
                    backgroundColor: secondaryColor,
                    borderColor: secondaryColor,
                    borderWidth: 2,
                    pointRadius: 0,
                    cubicInterpolationMode: 'monotone',

                }]
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

        this.chart.update();

        window.addEventListener('resize', () => {this.update_size();});
        this.update_size();

        
    }

    displayFlight(flight:Flight){
        this.flight = flight;
        if (this.flight != undefined)
            this.open();
        else
            this.close();
    }

    update(timestamp:number){
        this.lasttimestamp = timestamp;
        if (this.flight == undefined){
            return;
        }
        // update the variable displayed
        var variables = this.flight.getDataToDisplay(timestamp);
        this.callsign_html.innerHTML = variables.callsign;
        this.icao24_html.innerHTML = variables.icao24;
        this.velocity_html.innerHTML = float_to_string(variables.velocity, 0);
        this.heading_html.innerHTML = float_to_string(variables.heading, 0);
        this.altitude_html.innerHTML = float_to_string(variables.altitude, 0);   
        this.vertical_rate_html.innerHTML = float_to_string(variables.vertical_rate, 1);
        this.on_ground_html.innerHTML = variables.on_ground ? "on ground" : "in flight";
        this.squawk_html.innerHTML = variables.squawk != undefined ? variables.squawk.toString() : "None";
        this.alert_html.innerHTML = variables.alert ? "ALERT" : "NAD.";
        this.spi_html.innerHTML = variables.spi ? "SPI" : "NAD.";

        // update the chart
        var selected_variable = this.variable_selecor_html.value;
        var max_lenght = parseFloat(this.window_lenght_html.value) * 60;
        if (isNaN(max_lenght)){
            max_lenght = Number.MAX_SAFE_INTEGER - 1;
        }

        var profile = this.flight.getAttributeProfile(selected_variable, timestamp, max_lenght + 1);
        var ts = profile.timestamps;
        // var t0 = ts[0];
        var t_1 = ts[ts.length - 1];
        for (var i = 0; i < ts.length; i++){
            ts[i] = (ts[i] - t_1);
        }

        // auto adapt the time unit
        var time_window = ts[ts.length - 1] - ts[0];
        this.time_unit = 's'
        if (time_window > 100) //sec
        {
            this.time_unit = 'min';
            for (var i = 0; i < ts.length; i++){
                ts[i] = ts[i] / 60;
            }
        }
        if (time_window > 100 * 60) //min
        {
            this.time_unit = 'h';
            for (var i = 0; i < ts.length; i++){
                ts[i] = ts[i] / 60;
            }
        }      



        // var max_pts = 128;
        // // if (ts.length > max_pts), downsample the data
        // if (ts.length > max_pts){
        //     var step = Math.floor(ts.length / max_pts);
        //     // var delta = ts.length%step;
        //     var new_ts = [];
        //     var new_values = [];
        //     for (var i = 0; i < ts.length; i += step){
        //         new_ts.push(ts[i]);
        //         new_values.push(profile.values[i]);
        //     }
        //     ts = new_ts;
        //     profile.values = new_values;
        // }

        ts[ts.length - 1] = 0;

        // this.chart.options.scales.x.title.text = 'Time (' + scale + ')';
        this.chart.data.labels = ts;
        this.chart.data.datasets[0].data = profile.values;
        this.chart.data.datasets[0].label = selected_variable;
        this.chart.options.scales.x.title.text = 'Time (' + this.time_unit + ')';

        
        // this.chart.options.scales.x.ticks.font..size = 10;
        // this.chart.options.scales.y.ticks.fontSize = 10;
        this.chart.update();
    }

    update_size(){
        var font_size = Math.min(window.innerWidth / 100 * 2, window.innerHeight / 100 * 2, 15);
        
        this.chart.options.scales.x.ticks.font.size = font_size
        this.chart.options.scales.y.ticks.font.size = font_size
        this.chart.options.scales.x.ticks.padding = font_size / 4.0
        this.chart.options.scales.y.ticks.padding = font_size / 4.0
        this.chart.options.scales.x.grid.tickLength = font_size / 2.0
        this.chart.options.scales.y.grid.tickLength = font_size / 2.0
        this.chart.options.scales.x.title.font.size = font_size


        // if width of hight < 400px set line width to 1
        if (window.innerWidth < 400 || window.innerHeight < 400){
            // for each dataset
            for (var i = 0; i < this.chart.data.datasets.length; i++){
                this.chart.data.datasets[i].borderWidth = 1;
            }
        } else {
            for (var i = 0; i < this.chart.data.datasets.length; i++){
                this.chart.data.datasets[i].borderWidth = 2;
            }
        }

        
        this.chart.update();
    }



    open(){
        this.html.style.display = 'flex';
        this.html.style.opacity = 0;
        anime({
            targets: this.html,
            opacity: 1,
            duration: 200,
            easing: 'linear'
        });        
    }

    close(){
        anime({
            targets: this.html,
            opacity: 0,
            duration: 200,
            easing: 'linear',
            complete: function(anim){
                this.html.style.display = 'none';
                this.html.style.opacity = 1;
            }.bind(this)
        });
    }


    changeSpeed(){
        var value = this.window_lenght_html.value;
        // if the value is set to infinity, we do nothing
        if (value == "∞")
            return;

        // if value containe only [0-9] and '.' we parse it
        if (/^[0-9.]+$/.test(value)){

            var value = parseFloat(value);
            if (isNaN(value)){
                // set value to ∞
                if (value != "∞"){
                    this.window_lenght_html.value = "∞";
                }
            } 
        }
        else {
            // set value to ∞
            this.window_lenght_html.value = "∞";
        }
        this.update(this.lasttimestamp);
    }
}