import { FlightDB } from "./FlightDB";
import { FlightInfoDisplayer } from "./FlightDataDisplayer";
import { InputReader } from "./InputReader";
import { FlightMap } from "./FlightMap";
import * as U from './Utils';
import {AnomalyChecker} from "./AnomalyChecker";
import { FlightAttack } from "./FlightAttack";
import { Debugger } from "./Debugger";

// manage the timing of the simulation
// - play/pause
// - time speed
// - time jump when nothing is happening
// - time range slider update (on adding/removing aircrafts)
// - time display
// - gather flight at a given time
//      + ask the map to display the aircrafts

export class TimeManager{

    private FRAME_RATE = 20;

    private html_play_button: HTMLElement;
    private html_forward_button: HTMLElement;
    private html_rewind_button: HTMLElement;
    private html_time_range: HTMLInputElement;
    private html_speed_input: HTMLInputElement;
    private html_time_display: HTMLElement;
    private html_view_all_button: HTMLElement;

    private database:FlightDB
    private map:FlightMap
    private inputReader:InputReader
    private flightInfoDisplayer:FlightInfoDisplayer
    private anomalyChecker:AnomalyChecker
    private flightAttack: FlightAttack
    private debugger:Debugger

    private time:number = 0.0;
    private time_speed:number = 1.0;
    private running:boolean = false;
    private looping = false;
    private today:Date = new Date();
    private allow_jump:boolean = true;
    private view_all:boolean = false;

    // optimization
    private last_time:number = 0.0;
    private nb_aircraft:number = 0;
    private new_anomaly_received:boolean = false;

    private never_played:boolean = true;
    private requestQueue: { timestamp: number; time_speed: number }[] = [];
    private isProcessingQueue: boolean = false;
    private timeAlreadyPassed : number[]


    constructor(){
        this.html_play_button = document.getElementById('play-btn');
        this.html_forward_button = document.getElementById('forward-btn');
        this.html_rewind_button = document.getElementById('rewind-btn');
        this.html_time_range = <HTMLInputElement>document.getElementById('time-bar');
        this.html_speed_input = <HTMLInputElement>document.getElementById('time-speed');
        this.html_time_display = document.getElementById('time-display');
        this.html_view_all_button = document.getElementById('view-all-btn');


        this.html_play_button.addEventListener('click', this.onPlayButton.bind(this));
        this.html_forward_button.addEventListener('click', this.onForwardButton.bind(this));
        this.html_rewind_button.addEventListener('click', this.onRewindButton.bind(this));
        this.html_time_range.addEventListener('input', this.onTimeRange.bind(this));
        this.html_speed_input.addEventListener('change', this.onSpeedChange.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        this.html_view_all_button.addEventListener('click', this.onViewAll.bind(this));

        this.timeAlreadyPassed = []

        this.today = new Date();
        this.today.setHours(12,0,0,0);
    }

    public setExempleMode(mode:boolean){
        if (mode){
            this.time = (3 * this.database.getMinTimestamp() + 1 * this.database.getMaxTimestamp()) / (3 + 1);
            this.time_speed = 32;
            this.html_speed_input.value = this.time_speed.toString();
            this.looping = true;
            if (!this.running){
                this.onPlayButton();
            }
        }
        else{

            this.time = 0;
            this.time_speed = 1;
            this.html_speed_input.value = this.time_speed.toString();
            this.looping = false;
            if (this.running){
                this.onPlayButton();
            }
            this.never_played = true; // reset the never played flag (to startup play on the first flight watch)
        }
    }

    public setFlightDB(database:FlightDB){
        this.database = database;
    }
    public setMap(map:FlightMap){
        this.map = map;
    }
    public setInputReader(inputReader:InputReader){
        this.inputReader = inputReader;
    }
    public setFlightInfoDisplayer(flightInfoDisplayer:FlightInfoDisplayer){
        this.flightInfoDisplayer = flightInfoDisplayer;
    }
    public setAnomalyChecker(anomalyChecker:AnomalyChecker){
        this.anomalyChecker = anomalyChecker;
    }
    public setFlightAttack(flightAttack: FlightAttack){
        this.flightAttack = flightAttack;
    }
    public setDebugger(debug:Debugger){
        this.debugger = debug;
    }



    public start(){
        setInterval(this.update.bind(this), 1000.0/this.FRAME_RATE);
        setInterval(this.updateAnomaly.bind(this), 1000.0);
    }


    public setTimestamp(timestamp:number){
        this.time = timestamp;
    }
    public getTimestamp(){
        return this.time;
    }

    /** Toutes les secondes -> checkAnomaly et setAnomaly **/
    private async  updateAnomaly(){
        console.log("ok");

        if (!this.anomalyChecker.isServerInactive()){
            // gather for all visible aircrafts their messages since the last anomaly check
            let  [messages, icao24_to_reset] = this.database.getMessagesForAnomalyChecker(this.time)
            console.log(messages);
            console.log(icao24_to_reset);


            if (icao24_to_reset.length > 0){
                await this.anomalyChecker.resetFlights(icao24_to_reset);
            }
            if (await this.anomalyChecker.checkMessages(messages)){
                this.new_anomaly_received = true;
            }
        }
    }

    private async update() {
        if (this.inputReader.isProcessing()) {
            return;
        }
        let min_time = this.database.getMinTimestamp();
        let max_time = this.database.getMaxTimestamp();

        if (this.running) {
            this.time += this.time_speed / this.FRAME_RATE;
            this.never_played = false;
        }

        if (this.time < min_time) {
            this.time = min_time;
        }

        if (this.time > max_time) {
            if (this.looping) {
                this.time = min_time;
            } else { // stop the timer
                this.time = max_time;
                this.running = false;
                this.html_play_button.innerHTML = 'play_arrow';
            }
        }
        let ratio = (this.time - min_time) / (max_time - min_time);


        // update the time display
        let timestamp = this.time;
        // if there is no time set, display the current time
        if (this.time < 0) {
            timestamp = this.today.getTime() / 1000.0
        }


        // update the map display and the flight info displayed
        if (Math.floor(this.time) != Math.floor(this.last_time) || this.new_anomaly_received) {

            this.html_time_range.value = ratio.toString();
            this.html_time_display.innerHTML = U.timestamp_to_date_hour(timestamp);

            this.nb_aircraft = this.map.update(this.time, this.time);
            this.flightInfoDisplayer.update(this.time);
            this.debugger.update(this.time);

            this.flightAttack.update_stats();
            this.last_time = this.time;
            this.new_anomaly_received = false;
        }

        // do a jump is there is nothing to display or if the jump is activated
        if (this.nb_aircraft == 0 && this.allow_jump) {
            let next_flight_timing = this.database.nextFlight(this.time);
            if (next_flight_timing != undefined) {
                // set the time to 1.5 seconds before the next flight
                let jump_time = next_flight_timing.start - 1.5 * this.time_speed;

                // verify that the jump time is not before the current time
                if (jump_time > this.time) {
                    this.time = jump_time;
                }
            }
        }
        // reset the jump flag
        this.allow_jump = true;
    }

    public onPlayButton(){
        this.running = !this.running;

        if (this.running){
            this.html_play_button.innerHTML = 'pause';
            this.view_all = false;
        }
        else{
            this.html_play_button.innerHTML = 'play_arrow';
        }
    }

    public onForwardButton(){
        this.time += this.time_speed;
        // not nessessary to do a jump, next update will do it
    }

    public onRewindButton(){
        this.time -= this.time_speed;

        // nessessary to do a jump, next update will go forward and not on the previous flight
        if (this.nb_aircraft == 0 && this.allow_jump){
            let previous_flight_timing = this.database.previousFlight(this.time);
            if (previous_flight_timing != undefined){
                // set the time to 3 seconds before the end of the flight
                let jump_time = previous_flight_timing.end - 3 * this.time_speed;

                if (jump_time < previous_flight_timing.start){
                    jump_time = previous_flight_timing.start;
                }

                // verify that the jump time is before the current time
                if (jump_time < this.time){
                    this.time = jump_time;
                }
            }
            // lock to do two jumps before an map update (avoid jumping multiple flights)
            this.allow_jump = false;
        }
    }


    public onTimeRange(){
        let min_time = this.database.getMinTimestamp();
        let max_time = this.database.getMaxTimestamp();

        let ratio = parseFloat(this.html_time_range.value);
        this.time = min_time + (max_time - min_time)*ratio;
    }
    public onSpeedChange(){
        let speed = parseFloat(this.html_speed_input.value);
        if (speed <= 0){
            this.time_speed = 1;
            this.html_speed_input.value = '1';

            this.running = false;
            this.html_play_button.innerHTML = 'play_arrow';
        }
    }

    public onKeyDown(event:KeyboardEvent){
        if (event.key == 'ArrowRight'){
            this.onForwardButton();
            event.preventDefault();
        }
        else if (event.key == 'ArrowLeft'){
            this.onRewindButton();
            event.preventDefault();
        }
        else if (event.key == ' '){
            this.onPlayButton();
            event.preventDefault();
        }
        else if (event.key == 'ArrowUp'){
            this.time_speed *= 2;
            this.html_speed_input.value = this.time_speed.toString();
            event.preventDefault();
        }
        else if (event.key == 'ArrowDown'){
            this.time_speed /= 2;
            if (this.time_speed < 1)
                this.time_speed = 1;
            this.html_speed_input.value = this.time_speed.toString();
            event.preventDefault();
        }
    }


    private onViewAll(){
        this.view_all = !this.view_all;


        if (this.view_all && this.running){
            this.onPlayButton();
        }
        else if (!this.view_all && !this.running){
            this.onPlayButton();
        }

        if (this.view_all){
            let min_time = this.database.getMinTimestamp();
            let max_time = this.database.getMaxTimestamp();
            this.map.update(min_time, max_time);
        }
    }
    public updateViewAllFilter(){
        if (this.view_all){
            let min_time = this.database.getMinTimestamp();
            let max_time = this.database.getMaxTimestamp();
            this.map.update(min_time, max_time);
        }
    }


    public isRunning(){
        return this.running;
    }
    public neverPlayed(){
        return this.never_played;
    }
}