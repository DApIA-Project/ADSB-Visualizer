import { AircraftType, Flight } from './Flight';
import * as U from './Utils';

import * as M from './FlightMap';
import * as L from 'leaflet';
import { TimeManager } from './TimeManager';
import { loadFromCSV } from './parsers/parse_csv';
import { loadFromSBS } from './parsers/parse_sbs';
import { FlightInfoDisplayer } from './FlightDataDisplayer';


import * as URL from './Url'


// manage the flight database
// - load the flights from files
// - contains all the flights
// - sort them by start time for performances (find a flight by timestamp fastly)
//      + also for a nice display
// - manage the display of the flight list
//      + add/remove flights from the html list
//      + highlight the currents flights
//      + update the html list scroll when the time change



export class FlightDB{

    private map:M.FlightMap = undefined;
    private timer:TimeManager = undefined;
    private flightInfoDisplayer:FlightInfoDisplayer = undefined;

    private flights: Array<Flight> = Array();


    // to update the flight list display
    private html_flight_list: HTMLElement;
    private html_empty_flight_list: HTMLElement;
    private html_flights: Array<HTMLElement> = Array();
    private html_flights_visible: Array<boolean> = Array();
    private html_go_up_btn: HTMLElement;

    private html_research: HTMLElement;
    private html_filter_type:{[key: number]:HTMLElement} = {}
    private html_filter_string: HTMLInputElement;


    // stats about the database
    private min_timestamp:number = -1;
    private max_timestamp:number = -1;

    private allow_list_autoscroll:boolean = true;
    private next_scroll_is_autoscroll = false;
    private autoscroll_timeout:NodeJS.Timeout = undefined

    private example_mode:boolean = false;

    private filter_type:Map<AircraftType, boolean> = new Map();
    private filter_string:string = "";




    constructor()
    {
        this.html_flight_list = document.getElementById('flight-list');
        this.html_flight_list.addEventListener('scroll', (e) => {
            this.onScroll();
        });

        this.html_empty_flight_list = document.getElementById('empty-flight-list');

        document.getElementById('clear-list-btn').addEventListener('click', (e) => {
            this.clear();
        });

        this.html_go_up_btn = document.getElementById('go-up-btn');
        this.html_go_up_btn.addEventListener('click', (e) => {
            this.html_flight_list.scrollTop = 0;
        });
        this.html_go_up_btn.style.display = 'none';
        
        this.html_research = U.createElementFromHTML(
            `<div id="filter-input">
                <span>
                    <img src="${URL.plane}" alt="airplane" id="filter-img-type-${AircraftType.PLANE.toString()}">
                    <img src="${URL.helico}" alt="helico" id="filter-img-type-${AircraftType.HELICOPTER.toString()}">
                    <img src="${URL.lightplane}" alt="lightplane" id="filter-img-type-${AircraftType.LIGHT_PLANE.toString()}">
                    <img src="${URL.glider}" alt="glider" id="filter-img-type-${AircraftType.GLIDER.toString()}">
                    <img src="${URL.goundvehicle}" alt="ground" id="filter-img-type-${AircraftType.GROUND_VEHICLE.toString()}">
                    <img src="${URL.drone}" alt="drone" id="filter-img-type-${AircraftType.DRONE.toString()}">
                </span>
                <input type="text" id="reseach-bar" placeholder="Search by Icao, Callsign">
            </div>`)

            // <img src="${URL.military}" alt="ground" id="filter-img-type-${AircraftType.MILITARY.toString()}">
            // <img src="${URL.medium_plane}" alt="lightplane" id="filter-img-type-${AircraftType.MEDIUM_PLANE.toString()}">
            // <img src="${URL.ultra_lightplane}" alt="lightplane" id="filter-img-type-${AircraftType.ULTRA_LIGHT_PLANE.toString()}">


        

        var aircraft_types = [
            AircraftType.PLANE,
            AircraftType.HELICOPTER,
            AircraftType.LIGHT_PLANE,
            AircraftType.GLIDER,
            AircraftType.GROUND_VEHICLE,
            AircraftType.DRONE,
        ]
        
        // setup listeners
        for (let i = 0; i < aircraft_types.length; i++) {
            const key = aircraft_types[i];

            this.html_filter_type[key] = this.html_research.querySelector(`#filter-img-type-${key}`);
            
            if (this.html_filter_type[key] != undefined){
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

    public setMap(map:M.FlightMap) : void
    {
        this.map = map;
    }
    public setTimer(timer:TimeManager) : void
    {
        this.timer = timer;
    }
    public setFlightInfoDisplayer(flightInfoDisplayer:FlightInfoDisplayer) : void
    {
        this.flightInfoDisplayer = flightInfoDisplayer;
    }

    private parseFile(filename:string, content:string) : Array<Flight>
    {
        var flights:Array<Flight> = Array();
        var attributes:any = undefined
        
        if (filename.endsWith(".csv")){
            attributes = loadFromCSV(filename, content);
        }
        else if (filename.endsWith(".sbs"))
        {
            attributes = loadFromSBS(filename, content);
        }

        for (var i = 0; i < attributes.length; i++)
        {
            var flight = new Flight();
            flight.setAttribute(attributes[i]);
            flights.push(flight);
        }

        return flights;
    }

  

    public addFlights(filename:string, content:string, example_mode=false) : void
    {
        // code header (example mode) //
        var example_mode_changed = false;
        if (this.example_mode != example_mode)
        {
            example_mode_changed = true;
            // we change the mode, clear the db
            this.clear(false);
            // if we are in example mode -> start the timer example mode
            
        }
        this.example_mode = example_mode;


        if (this.flights.length == 0){
            // if it's the first data we load, we desactivate the autoscroll
            // desactivate autoscroll for 10 seconds
            this.allow_list_autoscroll = false;
            if (this.autoscroll_timeout != undefined)
                clearTimeout(this.autoscroll_timeout);
            
            // desactivate autoscroll for the next 3 second
            this.autoscroll_timeout = setTimeout(function(){
                this.allow_list_autoscroll = true;
                this.autoscroll_timeout = undefined;
                
            }.bind(this), 10 * 1000);
        }

        // code begining // 
        var flights = this.parseFile(filename, content);
        
        for (var i = 0; i < flights.length; i++)
        {
            var flight = flights[i];

            if (!this.exist(flight))
            {

                
                // add flight object
                // sorted by start time
                var t = 0;
                while (t < this.flights.length && this.flights[t].getStartTimestamp() < flight.getStartTimestamp()){
                    t++;
                }
                
                this.flights.splice(t, 0, flight);

                if (flight.getStartTimestamp() < this.min_timestamp || this.min_timestamp == -1){
                    this.min_timestamp = flight.getStartTimestamp();
                }
                if (flight.getEndTimestamp() > this.max_timestamp || this.max_timestamp == -1){
                    this.max_timestamp = flight.getEndTimestamp();
                }

                // if it's the first flight
                if (this.flights.length == 1 && !this.example_mode){
                    this.html_flight_list.appendChild(this.html_research);
                }
                
                // gen html
                var html_flight = this.generateFlightHTML(flight);
                this.html_flights.splice(t, 0, html_flight);
                this.html_flights_visible.splice(t, 0, false);

                if (!this.example_mode)
                    this.html_flight_list.insertBefore(html_flight, this.html_flight_list.childNodes[t + 1]);
            }
        }
        // re-calculate flight indexing
    
        this.recalculate_db();
        this.recalculate_display();

        if (example_mode_changed){
            this.timer.setExempleMode(example_mode);
        }
    }

    public removeFlight(index:number) : void
    {
        var flight = this.flights[index];

        if (flight.getStartTimestamp() == this.min_timestamp){
            this.min_timestamp = -1;
        }
        if (flight.getEndTimestamp() == this.max_timestamp){
            this.max_timestamp = -1;
        }

        this.flights.splice(index, 1);

        this.html_flights[index].remove();
        this.html_flights.splice(index, 1);
        this.html_flights_visible.splice(index, 1);

        if (this.flightInfoDisplayer.flight != undefined &&
            this.flightInfoDisplayer.flight == flight)
        {
            this.flightInfoDisplayer.close();
            this.flightInfoDisplayer.displayFlight(undefined);
        }

        this.recalculate_db();
    }


    private getImgURL(type:AircraftType) : string
    {
        switch(type){
            case AircraftType.PLANE:
                return URL.plane;
            case AircraftType.HELICOPTER:
                return URL.helico;
            case AircraftType.GROUND_VEHICLE:
                return URL.goundvehicle;
            case AircraftType.LIGHT_PLANE:
                return URL.lightplane;
            case AircraftType.ULTRA_LIGHT_PLANE:
                return URL.ultra_lightplane;
            case AircraftType.MEDIUM_PLANE:
                return URL.medium_plane;
            case AircraftType.GLIDER:
                return URL.glider;
            case AircraftType.MILITARY:
                return URL.military;
            default:
                return URL.question_mark;
        }
    }



    private generateFlightHTML(flight: Flight) : HTMLElement{
        var html_flight = document.createElement('div');
        html_flight.classList.add('flight');
        html_flight.innerHTML = `
            <div class="flight-info">
                <img src="${this.getImgURL(flight.getType())}" class="flight-img">
                <div class="flight-casllsign">${flight.callsign}</div>
                <div class="flight-iscao24">${flight.icao24}</div>
                <div class="flight-date">${U.timestamp_to_date(flight.getStartTimestamp())}</div>
            </div>
        `;
        html_flight.setAttribute("visible", "false");


        var html_search_btn = document.createElement('a');
        html_search_btn.classList.add('btn-valid');
        html_search_btn.classList.add('material-icons-outlined');
        html_search_btn.innerHTML = 'search';

        var html_delete_btn = document.createElement('a');
        html_delete_btn.classList.add('btn-cancel');
        html_delete_btn.classList.add('material-icons-outlined');
        html_delete_btn.innerHTML = 'delete';

        html_delete_btn.addEventListener('click', function(e){
            this.removeFlight(e.target.getAttribute("flight-num"))
        }.bind(this));

        html_search_btn.addEventListener('click', function(e){
            var i = e.target.getAttribute("flight-num");
            
            this.watchFlight(this.flights[i]);
        }.bind(this));

        html_flight.appendChild(html_search_btn);
        html_flight.appendChild(html_delete_btn);

        return html_flight;
    }   

    public watchFlight(flight:Flight) : void
    {
        this.map.fitBounds(flight.getbounds());

        // if flight is not visible, set timer to flight start time
        if (this.timer.getTimestamp() < flight.getStartTimestamp() 
            || this.timer.getTimestamp() > flight.getEndTimestamp()){

            this.timer.setTimestamp(flight.getStartTimestamp());
        }

        // if the user never used the timer (inital configuration -> paused timer), 
        // play it automatically
        if (this.timer.neverPlayed()){
            this.timer.onPlayButton();
        }

        this.flightInfoDisplayer.displayFlight(flight);
        this.flightInfoDisplayer.update(this.timer.getTimestamp());
    }

    public recalculate_db() : void
    {
        this.min_timestamp = -1;
        this.max_timestamp = -1;

        for (let i = 0; i < this.flights.length; i++) {
            // recalculate index in list
            this.html_flights[i].children[1].setAttribute("flight-num", i.toString());
            this.html_flights[i].children[2].setAttribute("flight-num", i.toString());


            if (this.flights[i].getStartTimestamp() < this.min_timestamp || this.min_timestamp == -1){
                this.min_timestamp = this.flights[i].getStartTimestamp();
            }

            if (this.flights[i].getEndTimestamp() > this.max_timestamp || this.max_timestamp == -1){
                this.max_timestamp = this.flights[i].getEndTimestamp();
            }
        }

        if (this.flights.length == 0 || this.example_mode){
            this.html_empty_flight_list.style.display = 'flex';
            this.html_go_up_btn.style.display = 'none';
            this.html_flight_list.innerHTML = "";
            
        }
        else{
            this.html_empty_flight_list.style.display = 'none';
            this.html_go_up_btn.style.display = 'block';
        }


        this.timer.updateViewAllFilter();
    }
    public recalculate_display() : void{
        for (let i = 0; i < this.flights.length; i++) {
            if (this.filter_type.get(this.flights[i].getType())
             && this.match_filter_string(this.flights[i].icao24, this.flights[i].callsign))
            {
                this.html_flights[i].style.display = 'flex';
            }
            else{
                this.html_flights[i].style.display = 'none';
            }
        }

        this.timer.updateViewAllFilter();
    }


    public getMapData(timestamp:number = undefined, end:number = undefined) : 
        Array<{type: AircraftType;callsign: string;icao24: string;coords: [number, number][];rotation:number;start_time: number;end_time: number; flight:Flight, display_opt: {[key:string]:any[]}}>
    {
        var flights = Array();
        for (let i = 0; i < this.flights.length; i++) {

            if (end == undefined || 
                (this.filter_type.get(this.flights[i].getType()) && this.match_filter_string(this.flights[i].icao24, this.flights[i].callsign))){


                var data = this.flights[i].getMapData(timestamp, end)
                if (data.coords.length > 0){
                    data["flight"] = this.flights[i];
                    flights.push(data);

                    // the map asked for this flight, so we make it visible
                    this.html_flights[i].setAttribute("visible", "true");
                    if (!this.html_flights_visible[i]){
                        this.autoscroll(i);
                    }
                    this.html_flights_visible[i] = true;
                }
                else{
                    this.html_flights[i].setAttribute("visible", "false");
                    this.html_flights_visible[i] = false;
                }
            }
        }
        return flights;
    }


    public getMinTimestamp() : number
    {
        return this.min_timestamp;
    }

    public getMaxTimestamp() : number
    {
        return this.max_timestamp;
    }

    public computeBoundingBox() : L.LatLngBounds
    {
        var alllatlngs = Array();
        for (let i = 0; i < this.flights.length; i++) {
            
            var bounds = this.flights[i].getbounds();
            
            var flight_min_lat = bounds.getSouth();
            var flight_max_lat = bounds.getNorth();
            var flight_min_lon = bounds.getWest();
            var flight_max_lon = bounds.getEast();

            alllatlngs.push([flight_min_lat, flight_min_lon]);
            alllatlngs.push([flight_max_lat, flight_max_lon]);
        }

        if (alllatlngs.length == 0)
            // whole world center 0, 0, zoom 2
            return undefined;

        var bounds = L.latLngBounds(alllatlngs);

        return bounds
    }

    public nextFlight(timestamp:number) : {start:number, end:number}
    {
        var i = 0;
        while (i < this.flights.length && this.flights[i].getStartTimestamp() < timestamp){
            i++;
        }
        if (i < this.flights.length)
            return {start:this.flights[i].getStartTimestamp(), end:this.flights[i].getEndTimestamp()};
        return undefined;
    }
    public previousFlight(timestamp:number) : {start:number, end:number}
    {
        var i = 0;
        while (i < this.flights.length && this.flights[i].getStartTimestamp() < timestamp){
            i++;
        }
        if (i > 0)
            return {start:this.flights[i-1].getStartTimestamp(), end:this.flights[i-1].getEndTimestamp()};
        return undefined;
    }

    private autoscroll(aircraft_i:number){
        if (this.allow_list_autoscroll == false)
            return;
        // this flight has becomes visible : auto scroll to it if it's not visible
        // put it in the middle of the list
        var i = aircraft_i; 
        
        if (this.html_flights[i].offsetTop > this.html_flight_list.scrollTop + this.html_flight_list.clientHeight ||
            this.html_flights[i].offsetTop + this.html_flights[i].clientHeight < this.html_flight_list.scrollTop){
            this.html_flight_list.scrollTop = this.html_flights[i].offsetTop - this.html_flight_list.clientHeight/2;
            this.next_scroll_is_autoscroll = true;
        }
    }
    private onScroll(){
        if (this.next_scroll_is_autoscroll){
            this.next_scroll_is_autoscroll = false;
            return;
        }
        this.allow_list_autoscroll = false;

        
        if (this.autoscroll_timeout != undefined)
            clearTimeout(this.autoscroll_timeout);
        

        // desactivate autoscroll for the next 40 second
        this.autoscroll_timeout = setTimeout(function(){
            this.allow_list_autoscroll = true;
            this.autoscroll_timeout = undefined;
            
        }.bind(this), 40 * 1000);
    }

    private clear(useFilter:boolean = true){
        if (useFilter){
            var match_filter:Array<number> = Array(0)
            for (let i = 0; i < this.flights.length; i++) {
                if (this.filter_type.get(this.flights[i].getType())
                    && this.match_filter_string(this.flights[i].icao24, this.flights[i].callsign)){

                    match_filter.push(i);
                }
            }

            for (let i = match_filter.length-1; i >= 0 ; i--) {
                var j = match_filter[i];
                this.html_flight_list.removeChild(this.html_flights[j]);
                this.html_flights.splice(j, 1);
                this.html_flights_visible.splice(j, 1);
                this.flights.splice(j, 1);

                if (this.flightInfoDisplayer.flight == undefined &&
                    this.flightInfoDisplayer.flight == this.flights[j]){
                    this.flightInfoDisplayer.close();
                    this.flightInfoDisplayer.displayFlight(undefined);
                }
            }
        }
        else{
            this.flights = Array();
            this.html_flights = Array();
            this.html_flights_visible = Array();

            this.min_timestamp = -1;
            this.max_timestamp = -1;

            this.flightInfoDisplayer.close();
        }
        this.recalculate_db();
    }

    private filterByType(type: AircraftType){
        this.filter_type.set(type, !this.filter_type.get(type));
        if (this.filter_type.get(type))
            this.html_filter_type[type].style.borderColor = "white";
        else
            this.html_filter_type[type].style.borderColor = "transparent";

        // if all filter_type are false, we put UNKNOWN to true else false
        var all_false = true;
        var all_true = true;
        for (let k of this.filter_type.keys()) {

            if (k == AircraftType.UNKNOWN)
                continue;
            if (this.filter_type.get(k)){
                all_false = false;
            }
            else{
                all_true = false;
            }

        }
        
        this.filter_type.set(AircraftType.UNKNOWN, all_false || all_true);
        

        this.recalculate_display();
    }

    private filterByString(string: string){
        this.filter_string = string.trim().toLocaleLowerCase();

        this.recalculate_display();
    }

    private match_filter_string(icao24: string, callsign: string) : boolean
    {
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

    public exist(flight: Flight) : boolean
    {
        for (let i = 0; i < this.flights.length; i++) {
            if (this.flights[i].icao24 == flight.icao24 && this.flights[i].callsign == flight.callsign && this.flights[i].getStartTimestamp() == flight.getStartTimestamp())
                return true;
        }
        return false;
    }
}