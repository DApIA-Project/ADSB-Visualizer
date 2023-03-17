import { AircraftType, Flight } from './Flight';
import * as U from './Utils';

import {Map} from './Map';
import * as L from 'leaflet';
import { TimeManager } from './TimeManager';


var URL_helico = require('/src/assets/images/helico.gif')
var URL_plane = require('/src/assets/images/plane.gif')
var URL_glider = require('/src/assets/images/glider.png')
var URL_lightplane = require('/src/assets/images/light-plane.png')
var URL_goundvehicle = require('/src/assets/images/gound-vehicle.png')
var URL_unknown = require('/src/assets/images/unknown-plane.png')

// manage the flight database
// - contains all the flights
// - sort them by start time for performances (find a flight by timestamp fastly)
//      + also for a nice display
// - manage the display of the flight list
//      + add/remove flights from the html list
//      + highlight the currents flights
//      + update the html list scroll when the time change



export class FlightDB{

    private map:Map = undefined;
    private timer:TimeManager = undefined;

    private flights: Array<Flight> = Array();
    private flights_filename: Array<string> = Array();


    // to update the flight list display
    private html_flight_list: HTMLElement;
    private html_flights: Array<HTMLElement> = Array();
    private html_flights_visible: Array<boolean> = Array();


    // stats about the database
    private min_timestamp:number = -1;
    private max_timestamp:number = -1;

    private allow_list_autoscroll:boolean = true;
    private autoscroll_timeout:NodeJS.Timeout = undefined




    constructor()
    {
        this.html_flight_list = document.getElementById('flight-list');
        this.html_flight_list.addEventListener('scroll', (e) => {
            this.onScroll();
        });
    }

    public setMap(map:Map) : void
    {
        this.map = map;
    }
    public setTimer(timer:TimeManager) : void
    {
        this.timer = timer;
    }
  

    public addFlight(filename:string, content) : void
    {
        var flight = new Flight();
        if (flight.loadFromFile(filename, content)){
            // add flight object
            // sorted by start time
            var i = 0;
            while (i < this.flights.length && this.flights[i].getStartTimestamp() < flight.getStartTimestamp()){
                i++;
            }
            this.flights.splice(i, 0, flight);
            this.flights_filename.splice(i, 0, filename);

            if (flight.getStartTimestamp() < this.min_timestamp || this.min_timestamp == -1){
                this.min_timestamp = flight.getStartTimestamp();
            }
            if (flight.getEndTimestamp() > this.max_timestamp || this.max_timestamp == -1){
                this.max_timestamp = flight.getEndTimestamp();
            }

            // gen html
            var html_flight = this.generateFlightHTML(flight);
            this.html_flights.splice(i, 0, html_flight);
            this.html_flights_visible.splice(i, 0, false);

            this.html_flight_list.insertBefore(html_flight, this.html_flight_list.childNodes[i]);

            // re-calculate flight indexing
            this.recalculate_db();
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
        this.flights_filename.splice(index, 1);

        this.html_flights[index].remove();
        this.html_flights.splice(index, 1);
        this.html_flights_visible.splice(index, 1);

        this.recalculate_db();
    }


    private getImgURL(type:AircraftType) : string
    {
        switch(type){
            case AircraftType.PLANE:
                return URL_plane;
            case AircraftType.HELICOPTER:
                return URL_helico;
            case AircraftType.GROUND_VEHICLE:
                return URL_goundvehicle;
            case AircraftType.LIGHT_PLANE:
                return URL_lightplane;
            case AircraftType.GLIDER:
                return URL_glider;
            default:
                return URL_unknown;
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
            
            this.map.fitBounds(this.flights[i].getbounds());
            this.timer.setTimestamp(this.flights[i].getStartTimestamp());
        }.bind(this));

        html_flight.appendChild(html_search_btn);
        html_flight.appendChild(html_delete_btn);

        return html_flight;
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
    }

    public fileExists(filename:string) : boolean
    {
        return this.flights_filename.includes(filename);
    }


    public getMapData(timestamp:number = undefined, end:number = undefined) : 
        Array<{type: AircraftType;callsign: string;icao24: string;coords: [number, number][];rotation:number[];start_time: number;end_time: number;}>
    {
        var flights = Array();
        for (let i = 0; i < this.flights.length; i++) {

            var data = this.flights[i].getMapData(timestamp, end)
            if (data.coords.length > 0){
                flights.push(data);

                // the map asked for this flight, so we make it visible
                this.html_flights[i].setAttribute("visible", "true");
                if (!this.html_flights_visible[i]){
                    this.autoscroll(i)
                }
                this.html_flights_visible[i] = true;
            }
            else{
                this.html_flights[i].setAttribute("visible", "false");
                this.html_flights_visible[i] = false;
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
        }
    }
    private onScroll(){
        this.allow_list_autoscroll = false;

        
        if (this.autoscroll_timeout != undefined)
            clearTimeout(this.autoscroll_timeout);
        

        // desactivate autoscroll for the next 10 second
        this.autoscroll_timeout = setTimeout(function(){
            this.allow_list_autoscroll = true;
            this.autoscroll_timeout = undefined;
            
        }.bind(this), 10 * 1000);
    }
}