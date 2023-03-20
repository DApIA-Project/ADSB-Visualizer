import * as L from 'leaflet';
import * as U from './Utils';
// manage the data of a flight
// - store all the data of a flight

import { loadFromCSV } from './parsers/parse_csv';
import { loadFromSBS } from './parsers/parse_sbs';




// array of 3 numbers
var aircraft_types : [string, string, number][] = []
// load local file at "/src/assets/data/aircraft.txt"
var aircraft_file = require('url:/src/assets/data/aircraft.txt');
// split the file content into lines
fetch(aircraft_file).then(response => response.text()).then(text => {

    var lines = text.split('\n');

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].split(',');
        aircraft_types.push([line[0], line[1], parseInt(line[2])]);
    }

    setTimeout(() => {
        document.getElementById("start-screen").style.display = "none";
    }, 500);
});
    



export enum AircraftType {
    PLANE,
    HELICOPTER,
    GLIDER,
    LIGHT_PLANE,
    GROUND_VEHICLE,
    UNKNOWN
}

function numberToType(number:number) : AircraftType
{
    if (number == 1){
        return AircraftType.PLANE;
    }
    else if (number == 5){
        return AircraftType.HELICOPTER;
    }
    else if (number == 4){
        return AircraftType.GLIDER;
    }
    else if (number == 2 || number == 3){
        return AircraftType.LIGHT_PLANE;
    }
    else if (number == 7){
        return AircraftType.GROUND_VEHICLE;
    }
    else{
        return AircraftType.UNKNOWN;
    }
}


function computeAircraftType(callsign:string, icao24:string) : AircraftType
{
    if (callsign.includes("SAMU"))
        return AircraftType.HELICOPTER;
    if (callsign.includes("AFR"))
        return AircraftType.PLANE;
    
    for (let i = 0; i < aircraft_types.length; i++) {
        if (aircraft_types[i][1] == icao24)
        {
            return numberToType(aircraft_types[i][2]);
        }
    }

    return AircraftType.UNKNOWN;
}





export class Flight
{

    private time:Array<number> = Array();
    public icao24:string =  "";
    private lat:Array<number> =  Array();
    private lon:Array<number> =  Array();
    private velocity:Array<number> =  Array();
    private heading:Array<number> =  Array();
    private vertical_rate:Array<number> =  Array();
    public callsign:string =  "";
    private on_ground:Array<boolean> =  Array();
    private alert:Array<boolean> =  Array();
    private spi:Array<boolean> =  Array();
    private squawk:Array<number> =  Array();
    private baro_altitude:Array<number> =  Array();
    private geo_altitude:Array<number> =  Array();
    private last_pos_update:Array<number> =  Array();
    private last_contact:Array<number> =  Array();
    private hour:Array<number> =  Array();
    private start_time:number =  0;
    private end_time:number =  0;
    private type:AircraftType =  AircraftType.UNKNOWN;


    constructor()
    {
        
    }

    setAttribute(a)
    {
        this.time = a.time;
        this.icao24 = a.icao24;
        this.lat = a.lat;
        this.lon = a.lon;
        this.velocity = a.velocity;
        this.heading = a.heading;
        this.vertical_rate = a.vertical_rate;
        this.callsign = a.callsign;
        this.on_ground = a.on_ground;
        this.alert = a.alert;
        this.spi = a.spi;
        this.squawk = a.squawk;
        this.baro_altitude = a.baro_altitude;
        this.geo_altitude = a.geo_altitude;
        this.last_pos_update = a.last_pos_update;
        this.last_contact = a.last_contact;
        this.hour = a.hour;
        this.start_time = a.start_time;
        this.end_time = a.end_time;
        this.type = computeAircraftType(this.callsign, this.icao24);

        console.log(this);
        
    }

    
    getLatLngs() : [number,number][]
    {
        var latlngs:[number,number][] = [];
        for (var i = 0; i < this.lat.length; i++) {
            if (this.lat[i] == this.lat[i]  && this.lon[i] == this.lon[i]){
                latlngs.push([this.lat[i], this.lon[i]]);
            }
        }
        return latlngs;
    }

    getbounds() : L.LatLngBounds
    {
        var latlngs = this.getLatLngs();
        
        
        var bounds = L.latLngBounds(latlngs);
        return bounds;
    }

    getLatLngsForTime(time) : [number,number][]
    {
        const MAX_LENGTH = 1000;
        if (time < this.start_time){
            return [];
        }
        if (time > this.end_time){
            return [];
        }

        var latlngs:[number,number][] = [];
        var i = 0;
        while (i < this.time.length && this.time[i] < time){
            i++;
        }
        i = Math.max(0, i - MAX_LENGTH);
        while (this.time[i] < time){
            latlngs.push([this.lat[i], this.lon[i]]);
            i++;
        }
        return latlngs;
    }

    getRotationAtTime(time) : number
    {
        if (time < this.start_time){
            return 0;
        }
        if (time > this.end_time){
            return 0;
        }

        var i = 0;
        while (i < this.time.length && this.time[i] < time){
            i++;
        }
        return this.heading[i];
    }

    getStartTimestamp() : number
    {
        return this.start_time;
    }
    getEndTimestamp() : number
    {
        return this.end_time;
    }


    getMapData(timestamp:number=undefined, end:number=undefined):
        {type: AircraftType;callsign: string;icao24: string;coords: [number, number][];rotation:number;start_time: number;end_time: number;}
    {

        const MAX_LENGTH = 10000;
        if (timestamp == undefined){
            timestamp = this.end_time;
        }
        if (end == undefined){
            // check if timestamp is in range
            
            if (timestamp > this.end_time || timestamp < this.start_time){
                return {"type": AircraftType.UNKNOWN,"callsign": "NULL","icao24": "NULL","coords": [], "rotation":-1,"start_time": -1,"end_time": -1,};
            }
            // if it's the case gather all data
            var coords:[number, number][] = [];
            var rot:number[] = [];
            var i = 0;
            while (i < this.time.length && this.time[i] <= timestamp){
                i++;
            }
            i = Math.max(0, i - MAX_LENGTH);
            while (i < this.time.length && this.time[i] <= timestamp){
                coords.push([this.lat[i], this.lon[i]]);
                
                i++;
            }
            
            
            return {
                "type": this.type,
                "callsign": this.callsign,
                "icao24": this.icao24,
                "coords": coords,
                "rotation":  this.heading[i - 1],
                "start_time": this.start_time,
                "end_time": this.end_time,
            };
        }
        else
        {
            if (timestamp > this.end_time || timestamp < this.start_time){
                return {"type": AircraftType.UNKNOWN,"callsign": "NULL","icao24": "NULL","coords": [], "rotation":-1,"start_time": -1,"end_time": -1,};
            }

            if (timestamp < this.start_time){
                timestamp = this.start_time;
            }
            if (end > this.end_time){
                end = this.end_time;
            }

            var coords:[number, number][] = [];
            var i = 0;
            while (this.time[i] < timestamp){
                coords.push([this.lat[i], this.lon[i]]);
                i++;
            }
            return {
                "type": this.type,
                "callsign": this.callsign,
                "icao24": this.icao24,
                "coords": coords,
                "rotation": this.heading[i - 1],
                "start_time": this.start_time,
                "end_time": this.end_time,
            };
        }
    }


    public getType() : AircraftType
    {
        return this.type;
    }
}

export default Flight;