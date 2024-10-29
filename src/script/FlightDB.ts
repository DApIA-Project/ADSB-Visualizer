import {AircraftType, Flight} from './Flight';
import * as U from './Utils';

import * as M from './FlightMap';
import * as L from 'leaflet';
import {TimeManager} from './TimeManager';
import {loadFromCSV} from './parsers/parse_csv';
import {loadFromSBS} from './parsers/parse_sbs';
import {FlightInfoDisplayer} from './FlightDataDisplayer';


import * as URL from './Url'
import {Recording} from "@dapia-project/recording-streamer/dist/types";
import { ADSBMessage, ApiRequest, MapMessage } from './Types';
import { Debugger } from './Debugger';


// manage the flight database
// - load the flights from files
// - contains all the flights
// - sort them by start time for performances (find a flight by timestamp fastly)
//      + also for a nice display
// - manage the display of the flight list
//      + add/remove flights from the html list
//      + highlight the currents flights
//      + update the html list scroll when the time change


export class FlightDB {

    private map: M.FlightMap = undefined;
    private timer: TimeManager = undefined;
    private flightInfoDisplayer: FlightInfoDisplayer = undefined;
    private debugger: Debugger = undefined;

    private flights: Array<Flight> = Array();
    private hash_table: { [key: number]: Flight } = {};


    // to update the flight list display
    private html_flight_list: HTMLElement;
    private html_empty_flight_list: HTMLElement;
    private html_flights: Array<HTMLElement> = Array();
    private html_flights_visible: Array<boolean> = Array();
    private html_go_up_btn: HTMLElement;

    private html_research: HTMLElement;
    private html_filter_type: { [key: number]: HTMLElement } = {}
    private html_filter_string: HTMLInputElement;


    // stats about the database
    private min_timestamp: number = -1;
    private max_timestamp: number = -1;

    private allow_list_autoscroll: boolean = true;
    private next_scroll_is_autoscroll = false;
    private autoscroll_timeout: NodeJS.Timeout = undefined

    private example_mode: boolean = false;

    private filter_type: Map<AircraftType, boolean> = new Map();
    private filter_string: string = "";

    private _stats: { [key: string]: number } = {};

    constructor() {
        this.html_flight_list = document.getElementById('flight-list');
        this.html_flight_list.addEventListener('scroll', (e) => {
            this.onScroll();
        });

        this.html_empty_flight_list = document.getElementById('empty-flight-list');

        document.getElementById('clear-list-btn').addEventListener('click', (e) => {
            this.clear();
        });

        document.getElementById('reset-btn').addEventListener('click', (e) => {
            this.reset();
            this.timer.setTimestamp(this.min_timestamp);
        });

        this.html_go_up_btn = document.getElementById('go-up-btn');
        this.html_go_up_btn.addEventListener('click', (e) => {
            this.html_flight_list.scrollTop = 0;
        });
        this.html_go_up_btn.style.display = 'none';

        this.html_research = U.createElementFromHTML(
            `<div id="filter-input">
                <span>
                    <img src="${URL.cargo}" alt="cargo" id="filter-img-type-${AircraftType.CARGO.toString()}">
                    <img src="${URL.plane}" alt="plane" id="filter-img-type-${AircraftType.PLANE.toString()}">
                    <img src="${URL.jet}" alt="jet" id="filter-img-type-${AircraftType.JET.toString()}">
                    <img src="${URL.turboprop}" alt="turboprop" id="filter-img-type-${AircraftType.TURBOPROP.toString()}">
                    <img src="${URL.medium}" alt="medium" id="filter-img-type-${AircraftType.MEDIUM.toString()}">
                    <img src="${URL.light}" alt="light" id="filter-img-type-${AircraftType.LIGHT.toString()}">
                    <img src="${URL.super_light}" alt="super_light" id="filter-img-type-${AircraftType.SUPER_LIGHT.toString()}">
                    <img src="${URL.glider}" alt="glider" id="filter-img-type-${AircraftType.GLIDER.toString()}">
                    <img src="${URL.helicopter}" alt="helicopter" id="filter-img-type-${AircraftType.HELICOPTER.toString()}">
                    <img src="${URL.ulm}" alt="ulm" id="filter-img-type-${AircraftType.ULM.toString()}">
                    <img src="${URL.military}" alt="military" id="filter-img-type-${AircraftType.MILITARY.toString()}">
                    <img src="${URL.samu}" alt="samu" id="filter-img-type-${AircraftType.SAMU.toString()}">
                    <img src="${URL.ground_vehicle}" alt="ground_vehicle" id="filter-img-type-${AircraftType.GROUND_VEHICLE.toString()}">
                    <img src="${URL.drone}" alt="drone" id="filter-img-type-${AircraftType.DRONE.toString()}">
                </span>
                <input type="text" id="reseach-bar" placeholder="Search by Icao, Callsign">
            </div>`)

        let aircraft_types = [
            AircraftType.CARGO,
            AircraftType.PLANE,
            AircraftType.JET,
            AircraftType.TURBOPROP,
            AircraftType.MEDIUM,
            AircraftType.LIGHT,
            AircraftType.SUPER_LIGHT,
            AircraftType.GLIDER,
            AircraftType.HELICOPTER,
            AircraftType.ULM,
            AircraftType.MILITARY,
            AircraftType.SAMU,
            AircraftType.GROUND_VEHICLE,
            AircraftType.DRONE,
        ]

        // setup listeners
        for (let i = 0; i < aircraft_types.length; i++) {
            const key = aircraft_types[i];

            this.html_filter_type[key] = this.html_research.querySelector(`#filter-img-type-${key}`);

            if (this.html_filter_type[key] != undefined) {
                this.html_filter_type[key].addEventListener('click', (e) => {
                    this.filterByType(key);

                });
                this.filter_type.set(key, true);
            }
        }
        this.filter_type.set(AircraftType.UNKNOWN, true);


        // setup the search bar
        this.html_filter_string = this.html_research.getElementsByTagName('input')[0];
        this.html_filter_string.addEventListener('input', (e) => {
            this.filterByString(this.html_filter_string.value);
        });


    }

    public setMap(map: M.FlightMap): void {
        this.map = map;
    }

    public setTimer(timer: TimeManager): void {
        this.timer = timer;
    }

    public setFlightInfoDisplayer(flightInfoDisplayer: FlightInfoDisplayer): void {
        this.flightInfoDisplayer = flightInfoDisplayer;
    }

    public setDebugger(debug: any): void {
        this.debugger = debug;
    }

    private static parseFile(filename: string, content: string): Array<Flight> {
        let flights: Array<Flight> = Array();
        let attributes: any = undefined

        if (filename.endsWith(".csv")) {
            attributes = loadFromCSV(filename, content);
        } else if (filename.endsWith(".sbs")) {
            attributes = loadFromSBS(filename, content);

        } else {
            // unknown file format
            return flights;
        }

        for (let i = 0; i < attributes.length; i++) {
            let flight = new Flight();
            flight.setAttribute(attributes[i]);
            flights.push(flight);
        }

        return flights;
    }


    public addFlights(filename: string, content: string, example_mode = false): void {
        // code header (example mode) //
        let example_mode_changed = false;
        if (this.example_mode != example_mode) {
            example_mode_changed = true;
            // we change the mode, clear the db
            this.clear(false);
            // if we are in example mode -> start the timer example mode

        }
        this.example_mode = example_mode;


        if (this.flights.length == 0) {
            // if it's the first data we load, we desactivate the autoscroll
            // desactivate autoscroll for 10 seconds
            this.allow_list_autoscroll = false;
            if (this.autoscroll_timeout != undefined)
                clearTimeout(this.autoscroll_timeout);

            // desactivate autoscroll for the next 3 second
            this.autoscroll_timeout = setTimeout(function () {
                this.allow_list_autoscroll = true;
                this.autoscroll_timeout = undefined;

            }.bind(this), 10 * 1000);
        }

        // code begining //
        let flights = FlightDB.parseFile(filename, content);

        for (let i = 0; i < flights.length; i++) {
            let flight = flights[i];

            if (!this.exist(flight)) {

                this.addFlight(flight);
            }
        }
        // re-calculate flight indexing

        this.recalculate_db();
        this.recalculate_display();

        if (example_mode_changed) {
            this.timer.setExempleMode(example_mode);
        }
    }

    public addFlight(flight: Flight): void {
        let t = 0;
        while (t < this.flights.length && this.flights[t].getStartTimestamp() < flight.getStartTimestamp()) {
            t++;
        }
        this.flights.splice(t, 0, flight);

        this.hash_table[flight.getHash()] = flight;

        if (flight.getStartTimestamp() < this.min_timestamp || this.min_timestamp == -1) {
            this.min_timestamp = flight.getStartTimestamp();
        }
        if (flight.getEndTimestamp() > this.max_timestamp || this.max_timestamp == -1) {
            this.max_timestamp = flight.getEndTimestamp();
        }
        // if it's the first flight
        if (this.flights.length == 1 && !this.example_mode) {
            this.html_flight_list.appendChild(this.html_research);
        }
        // gen html
        let html_flight = this.generateFlightHTML(flight);
        this.html_flights.splice(t, 0, html_flight);
        this.html_flights_visible.splice(t, 0, false);

        if (!this.example_mode)
            this.html_flight_list.insertBefore(html_flight, this.html_flight_list.childNodes[t + 1]);
    }

    public addMessage(timestamp: number, icao24: string, latitude: number, longitude: number, groundspeed: number, track: number, vertical_rate: number, callsign: string, onground: boolean, alert: boolean, spi: boolean, squawk: number, altitude: number, geoaltitude: number): void {
        let example_mode_changed = false;
        if (this.example_mode) {
            example_mode_changed = true;
            this.example_mode = false;
            // we change the mode, clear the db
            this.clear(false);
        }


        if (callsign == null) callsign = "null";

        let flight:Flight = this.getFlightWithICAO(icao24)
        if (flight == undefined){

            flight = new Flight()
            flight.addMessage(timestamp, icao24, latitude, longitude, groundspeed, track, vertical_rate, callsign, onground, alert, spi, squawk, altitude, geoaltitude)
            this.addFlight(flight)

            this.recalculate_db();
            this.recalculate_display();
        }
        else
        {
            flight.addMessage(timestamp, icao24, latitude, longitude, groundspeed, track, vertical_rate, callsign, onground, alert, spi, squawk, altitude, geoaltitude)
            if (timestamp > this.max_timestamp || this.max_timestamp == -1) {
                this.max_timestamp = timestamp;
            }
        }

        if (example_mode_changed) {
            this.timer.setExempleMode(this.example_mode);
        }

    }



    public removeFlight(index: number): void {
        let flight = this.flights[index];

        if (flight.getStartTimestamp() == this.min_timestamp) {
            this.min_timestamp = -1;
        }
        if (flight.getEndTimestamp() == this.max_timestamp) {
            this.max_timestamp = -1;
        }

        delete this.hash_table[flight.getHash()];
        this.flights.splice(index, 1);

        this.html_flights[index].remove();
        this.html_flights.splice(index, 1);
        this.html_flights_visible.splice(index, 1);

        const watched_flight = this.flightInfoDisplayer.getFlight();
        if (watched_flight != undefined && watched_flight == flight) {
            this.flightInfoDisplayer.close();
            this.flightInfoDisplayer.displayFlight(undefined);
        }

        const debug_flight = this.debugger.getFlight();
        if (debug_flight != undefined && debug_flight == flight) {
            this.debugger.close();
            this.debugger.displayFlight(undefined);
        }

        this.recalculate_db();
    }


    private getImgURL(type: AircraftType): string {
        switch (type) {
            case AircraftType.CARGO:
                return URL.cargo;
            case AircraftType.PLANE:
                return URL.plane;
            case AircraftType.JET:
                return URL.jet;
            case AircraftType.TURBOPROP:
                return URL.turboprop;
            case AircraftType.MEDIUM:
                return URL.medium;
            case AircraftType.LIGHT:
                return URL.light;
            case AircraftType.SUPER_LIGHT:
                return URL.super_light;
            case AircraftType.GLIDER:
                return URL.glider;
            case AircraftType.HELICOPTER:
                return URL.helicopter;
            case AircraftType.ULM:
                return URL.ulm;
            case AircraftType.MILITARY:
                return URL.military;
            case AircraftType.SAMU:
                return URL.samu;
            case AircraftType.GROUND_VEHICLE:
                return URL.ground_vehicle;
            case AircraftType.DRONE:
                return URL.drone;
            default:
                return URL.question_mark;
        }
    }


    private generateFlightHTML(flight: Flight): HTMLElement {
        let html_flight = document.createElement('div');
        html_flight.classList.add('flight');
        let mid = Math.floor(flight.callsign.length/2);
        html_flight.innerHTML = `
            <div class="flight-info">
                <img src="${this.getImgURL(flight.getType())}" class="flight-img">
                <div class="flight-casllsign">${flight.callsign[mid]}</div>
                <div class="flight-iscao24">${flight.icao24}</div>
                <div class="flight-date">${U.timestamp_to_date(flight.getStartTimestamp())}</div>
            </div>
        `;
        html_flight.setAttribute("visible", "false");


        let html_search_btn = document.createElement('a');
        html_search_btn.classList.add('btn-valid');
        html_search_btn.classList.add('material-symbols-outlined');
        html_search_btn.innerHTML = 'search';

        let html_delete_btn = document.createElement('a');
        html_delete_btn.classList.add('btn-cancel');
        html_delete_btn.classList.add('material-symbols-outlined');
        html_delete_btn.innerHTML = 'delete';

        html_delete_btn.addEventListener('click', function (e) {
            this.removeFlight(e.target.getAttribute("flight-num"))
        }.bind(this));

        html_search_btn.addEventListener('click', function (e) {
            let i = e.target.getAttribute("flight-num");

            this.watchFlight(this.flights[i].getHash());
        }.bind(this));

        html_flight.appendChild(html_search_btn);
        html_flight.appendChild(html_delete_btn);

        return html_flight;
    }

    public watchFlight(flight_hash: number): void {
        const flight = this.hash_table[flight_hash];
        if (flight == undefined) return;
        this.map.fitBounds(flight.getbounds());
        this.map.highlightFlight(flight);

        // if flight is not visible, set timer to flight start time
        if (this.timer.getTimestamp() < flight.getStartTimestamp()
            || this.timer.getTimestamp() > flight.getEndTimestamp()) {

            this.timer.setTimestamp(flight.getStartTimestamp());
        }

        // if the user never used the timer (inital configuration -> paused timer),
        // play it automatically
        if (this.timer.neverPlayed()) {
            this.timer.onPlayButton();
        }

        this.flightInfoDisplayer.displayFlight(flight);
        this.flightInfoDisplayer.update(this.timer.getTimestamp());

        if (this.debugger.isActived()){
            this.debugger.displayFlight(flight);
            this.debugger.update(this.timer.getTimestamp());
        }
    }

    public recalculate_db(): void {
        this.min_timestamp = -1;
        this.max_timestamp = -1;

        for (let i = 0; i < this.flights.length; i++) {
            // recalculate index in list
            this.html_flights[i].children[1].setAttribute("flight-num", i.toString());
            this.html_flights[i].children[2].setAttribute("flight-num", i.toString());


            if (this.flights[i].getStartTimestamp() < this.min_timestamp || this.min_timestamp == -1) {
                this.min_timestamp = this.flights[i].getStartTimestamp();
            }

            if (this.flights[i].getEndTimestamp() > this.max_timestamp || this.max_timestamp == -1) {
                this.max_timestamp = this.flights[i].getEndTimestamp();
            }
        }

        if (this.flights.length == 0 || this.example_mode) {
            this.html_empty_flight_list.style.display = 'flex';
            this.html_go_up_btn.style.display = 'none';
            this.html_flight_list.innerHTML = "";

        } else {
            this.html_empty_flight_list.style.display = 'none';
            this.html_go_up_btn.style.display = 'block';
        }


        this.timer.updateViewAllFilter();
    }

    public recalculate_display(): void {
        for (let i = 0; i < this.flights.length; i++) {
            let mid = Math.floor(this.flights[i].callsign.length/2);
            if (this.filter_type.get(this.flights[i].getType())
             && this.match_filter_string(this.flights[i].icao24, this.flights[i].callsign[mid]))
            {
                this.html_flights[i].style.display = 'flex';
            } else {
                this.html_flights[i].style.display = 'none';
            }
        }

        this.timer.updateViewAllFilter();
    }


    public getMapData(timestamp:number = undefined, end:number = undefined, debug:boolean = false):
        Array<MapMessage>
    {
        let flight_data:Array<MapMessage> = Array();
        this._stats = { "valid": 0, "anomaly": 0 };
        for (let i = 0; i < this.flights.length; i++) {

            let mid = Math.floor(this.flights[i].callsign.length/2);

            if (end == undefined ||
                (this.filter_type.get(this.flights[i].getType()) && this.match_filter_string(this.flights[i].icao24, this.flights[i].callsign[mid]))){


                let data = this.flights[i].getMapData(timestamp, end, debug)
                for (const sub_data of data) {
                    flight_data.push(sub_data);
                }


                if (data.length > 0) {
                    // the map asked for this flight, so we make it visible
                    this.html_flights[i].setAttribute("visible", "true");
                    if (!this.html_flights_visible[i]) {
                        this.autoscroll(i);
                    }
                    this.html_flights_visible[i] = true;

                    for (const sub_data of data) {
                        let t = sub_data.anomaly.length - 1;
                        while (t >= 0 && sub_data.anomaly[t] == undefined) {
                            t--;
                        }
                        if (t >= 0) {
                            if (sub_data.anomaly[t]) {
                                this._stats["anomaly"] = this._stats["anomaly"] + 1;
                            } else {
                                this._stats["valid"] = this._stats["valid"] + 1;
                            }
                        }
                    }
                } else {
                    this.html_flights[i].setAttribute("visible", "false");
                    this.html_flights_visible[i] = false;
                }
            }
        }
        return flight_data;
    }



    public getMessagesForAnomalyChecker(timestamp:number = undefined) : ApiRequest
    {
        let data = Array<ADSBMessage>();
        let flight_hash = Array<number>();
        let flight_t = Array<number>();

        for (const flight of this.flights) {
            // if flight is not visible, we don't need to get the messages
            if (flight.getStartTimestamp() <= timestamp && timestamp <= flight.getEndTimestamp()) {

                let start_i = flight.getLastCheckRequest() + 1;
                let end_i = flight.getIndiceAtTime(timestamp, start_i-1);
                if(end_i == -1) continue;
                for (let j = start_i; j <= end_i; j++) {
                    data.push(flight.getMessage(j));
                    flight_hash.push(flight.getHash());
                    flight_t.push(j);
                }
                flight.setLastCheckRequest(end_i);
            }
        }

        return {data: data, flight_hash: flight_hash, flight_t: flight_t};
    }


    public getMinTimestamp(): number {
        return this.min_timestamp;
    }

    public getMaxTimestamp(): number {
        return this.max_timestamp;
    }

    public computeBoundingBox(): L.LatLngBounds {
        let alllatlngs = Array();
        for (const flight of this.flights) {

            let bounds = flight.getbounds();

            let flight_min_lat = bounds.getSouth();
            let flight_max_lat = bounds.getNorth();
            let flight_min_lon = bounds.getWest();
            let flight_max_lon = bounds.getEast();

            alllatlngs.push([flight_min_lat, flight_min_lon]);
            alllatlngs.push([flight_max_lat, flight_max_lon]);
        }

        if (alllatlngs.length == 0)
            // whole world center 0, 0, zoom 2
            return undefined;

        let bounds = L.latLngBounds(alllatlngs);

        return bounds
    }

    public nextFlight(timestamp: number): { start: number, end: number } {
        let i = 0;
        while (i < this.flights.length && this.flights[i].getStartTimestamp() < timestamp) {
            i++;
        }
        if (i < this.flights.length)
            return {start: this.flights[i].getStartTimestamp(), end: this.flights[i].getEndTimestamp()};
        return undefined;
    }

    public previousFlight(timestamp: number): { start: number, end: number } {
        let i = 0;
        while (i < this.flights.length && this.flights[i].getStartTimestamp() < timestamp) {
            i++;
        }
        if (i > 0)
            return {start: this.flights[i - 1].getStartTimestamp(), end: this.flights[i - 1].getEndTimestamp()};
        return undefined;
    }

    private autoscroll(aircraft_i: number) {
        if (this.allow_list_autoscroll == false)
            return;
        // this flight has becomes visible : auto scroll to it if it's not visible
        // put it in the middle of the list
        let i = aircraft_i;

        if (this.html_flights[i].offsetTop > this.html_flight_list.scrollTop + this.html_flight_list.clientHeight ||
            this.html_flights[i].offsetTop + this.html_flights[i].clientHeight < this.html_flight_list.scrollTop) {
            this.html_flight_list.scrollTop = this.html_flights[i].offsetTop - this.html_flight_list.clientHeight / 2;
            this.next_scroll_is_autoscroll = true;
        }
    }

    private onScroll() {
        if (this.next_scroll_is_autoscroll) {
            this.next_scroll_is_autoscroll = false;
            return;
        }
        this.allow_list_autoscroll = false;


        if (this.autoscroll_timeout != undefined)
            clearTimeout(this.autoscroll_timeout);


        // desactivate autoscroll for the next 40 second
        this.autoscroll_timeout = setTimeout(function () {
            this.allow_list_autoscroll = true;
            this.autoscroll_timeout = undefined;

        }.bind(this), 40 * 1000);
    }

    private clear(useFilter: boolean = true) {
        if (useFilter) {
            let match_filter: Array<number> = Array(0)
            for (let i = 0; i < this.flights.length; i++) {
                let mid = Math.floor(this.flights[i].callsign.length/2);
                if (this.filter_type.get(this.flights[i].getType())
                    && this.match_filter_string(this.flights[i].icao24, this.flights[i].callsign[mid])){

                    match_filter.push(i);
                }
            }


            for (let i = match_filter.length - 1; i >= 0; i--) {
                let j = match_filter[i];
                if (!this.example_mode)
                    this.html_flight_list.removeChild(this.html_flights[j]);
                this.html_flights.splice(j, 1);
                this.html_flights_visible.splice(j, 1);
                delete this.hash_table[this.flights[j].getHash()];
                this.flights.splice(j, 1);

                const watched_flight = this.flightInfoDisplayer.getFlight();
                if (watched_flight != undefined &&
                    watched_flight == this.flights[j]) {
                    this.flightInfoDisplayer.close();
                    this.flightInfoDisplayer.displayFlight(undefined);
                }
                if (this.debugger.isActived()){
                    const debug_flight = this.debugger.getFlight();
                    if (debug_flight != undefined && debug_flight == this.flights[j]) {
                        this.debugger.close();
                        this.debugger.displayFlight(undefined);
                    }
                }
            }
        } else {
            this.flights = Array();
            this.hash_table = {};
            this.html_flights = Array();
            this.html_flights_visible = Array();

            this.min_timestamp = -1;
            this.max_timestamp = -1;

            this.flightInfoDisplayer.close();
            if (this.debugger.isActived()) this.debugger.close();
        }
        this.recalculate_db();
    }

    private filterByType(type: AircraftType) {
        this.filter_type.set(type, !this.filter_type.get(type));
        if (this.filter_type.get(type))
            this.html_filter_type[type].style.borderColor = "white";
        else
            this.html_filter_type[type].style.borderColor = "transparent";

        // if all filter_type are false, we put UNKNOWN to true else false
        let all_false = true;
        let all_true = true;
        for (let k of this.filter_type.keys()) {

            if (k == AircraftType.UNKNOWN)
                continue;
            if (this.filter_type.get(k)) {
                all_false = false;
            } else {
                all_true = false;
            }

        }

        this.filter_type.set(AircraftType.UNKNOWN, all_false || all_true);


        this.recalculate_display();
    }

    private filterByString(string: string) {
        this.filter_string = string.trim().toLocaleLowerCase();

        this.recalculate_display();
    }

    private match_filter_string(icao24: string, callsign: string): boolean {
        icao24 = icao24.toLocaleLowerCase().trim();
        callsign = callsign.toLocaleLowerCase().trim();

        if (this.filter_string == "")
            return true;

        if (icao24.startsWith(this.filter_string))
            return true;

        if (callsign.startsWith(this.filter_string))
            return true;

        return false;
    }

    public exist(flight: Flight): boolean {
        return (this.hash_table[flight.getHash()] != undefined)
        // for (let i = 0; i < this.flights.length; i++) {
        //     if (this.flights[i].icao24 == flight.icao24 && this.flights[i].getStartTimestamp() == flight.getStartTimestamp())
        //         return true;
        // }
        // return false;
    }

    getFlights() : Flight[]{
        return this.flights;
    }
    getFlight(i : number) : Flight{
        return this.flights[i]
    }
    findFlight(hash : number) : Flight{
        return this.hash_table[hash]
    }

    getAllHashes() : number[]{
        return Object.keys(this.hash_table).map(Number)
    }

    public getFlightWithICAO(icao : string) : Flight{
        for (const flight of this.flights) {

            if(flight.get("icao24") === icao){
                return flight
            }
        }
        return undefined
    }

    public reset() {
        for (let flight of this.flights) {
            flight.reset();
        }
    }

    public getAnomalyStats():[number, number]{
        return [this._stats["valid"], this._stats["anomaly"]];
    }
}