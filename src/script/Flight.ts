import * as L from 'leaflet';
import * as U from './Utils';
import { ADSBMessage, MapMessage } from './Types';
// manage the data of a flight
// - store all the data of a flight



// array of 3 numbers
let aircraft_types : [string, number][] = []
// load local file at "/src/assets/data/aircraft.txt"
let aircraft_file = require('url:/src/assets/data/labels.csv');
// split the file content into lines
fetch(aircraft_file).then(response => response.text()).then(text => {

    let lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].split(',');
        aircraft_types.push([line[0], parseInt(line[1])]);
    }

    setTimeout(() => {
        document.getElementById("start-screen").style.display = "none";
    }, 500);
});




export enum AircraftType {
    UNKNOWN = 0,
    CARGO,
    PLANE,
    JET,
    TURBOPROP,
    MEDIUM,
    LIGHT,
    SUPER_LIGHT,
    GLIDER,
    HELICOPTER,
    ULM,
    MILITARY,
    SAMU,
    GROUND_VEHICLE,
    DRONE,
}

function numberToType(number:number) : AircraftType
{
    switch (number) {
        case 0:
            return AircraftType.UNKNOWN;
        case 1:
            return AircraftType.CARGO;
        case 2:
            return AircraftType.PLANE;
        case 3:
            return AircraftType.JET;
        case 4:
            return AircraftType.TURBOPROP;
        case 5:
            return AircraftType.MEDIUM;
        case 6:
            return AircraftType.LIGHT;
        case 7:
            return AircraftType.SUPER_LIGHT;
        case 8:
            return AircraftType.GLIDER;
        case 9:
            return AircraftType.HELICOPTER;
        case 10:
            return AircraftType.ULM;
        case 11:
            return AircraftType.MILITARY;
        case 12:
            return AircraftType.SAMU;
        case 13:
            return AircraftType.GROUND_VEHICLE;
        case 14:
            return AircraftType.DRONE;
        default:
            return AircraftType.UNKNOWN;
    }
}




function computeAircraftType(callsign:string, icao24:string) : AircraftType
{
    if (callsign.includes("SAMU"))
        return AircraftType.SAMU;
    if (callsign.includes("AFR"))
        return AircraftType.PLANE;


    for (const aircraft of aircraft_types) {
        if (aircraft[0] == icao24)
        {
            return numberToType(aircraft[1]);
        }
    }

    return AircraftType.UNKNOWN;
}


export class Flight
{

    public time:Array<number> = Array();
    public  icao24:string =  "";
    private lat:Array<number> =  Array();
    private lon:Array<number> =  Array();
    private velocity:Array<number> =  Array();
    private heading:Array<number> =  Array();
    private vertical_rate:Array<number> =  Array();
    public  callsign:Array<string> =  Array();
    private on_ground:Array<boolean> =  Array();
    private alert:Array<boolean> =  Array();
    private spi:Array<boolean> =  Array();
    private squawk:Array<number> =  Array();
    private baro_altitude:Array<number> =  Array();
    private geo_altitude:Array<number> =  Array();

    private type:AircraftType =  AircraftType.UNKNOWN;
    private start_time:number =  0;
    private end_time:number =  0;
    private anomaly:Array<boolean> =  Array();
    private tag:Array<string> =  Array();

    private hash:number =  0;

    private last_anomaly:number =  -1;
    private last_check_request:number =  -1;




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
        this.start_time = a.start_time;
        this.end_time = a.end_time;
        this.tag = new Array(this.time.length).fill("");

        let mid = Math.floor(this.callsign.length/2);
        this.type = computeAircraftType(this.callsign[mid], this.icao24);
        this.hash = this.computeHash();

        if (a.anomaly != undefined){
            this.anomaly = a.anomaly;
            this.last_anomaly = this.anomaly.length - 1;
        }
        else for (let i = 0; i < this.time.length; i++)
                this.anomaly.push(undefined);

    }

    addMessage(timestamp:number, icao24:string, latitude:number, longitude:number, groundspeed:number, track:number, vertical_rate:number, callsign:string, onground:boolean, alert:boolean, spi:boolean, squawk:number, altitude:number, geoaltitude:number)
    {
        this.time.push(timestamp);
        // this.icao24 = icao24;
        this.lat.push(latitude);
        this.lon.push(longitude);
        this.velocity.push(groundspeed);
        this.heading.push(track);
        this.vertical_rate.push(vertical_rate);
        this.callsign.push(callsign);
        this.on_ground.push(onground);
        this.alert.push(alert);
        this.spi.push(spi);
        this.squawk.push(squawk);
        this.baro_altitude.push(altitude);
        this.geo_altitude.push(geoaltitude);
        this.tag.push("");
        if (this.start_time == 0)
            this.start_time = timestamp;
        this.end_time = timestamp;
        if (this.icao24 == "")
        {
            this.icao24 = icao24;
            let mid = Math.floor(this.callsign.length/2);
            this.type = computeAircraftType(this.callsign[mid], this.icao24);
            this.hash = this.computeHash();
        }
        this.anomaly.push(undefined);
    }

    setAnomaly(indice : number, value : boolean){
        this.anomaly[indice] = value
        if (value != undefined){
            this.last_anomaly = indice;
        }
    }
    setTag(indice : number, value : string){
        this.tag[indice] = value;
    }
    getLastAnomalyIndice() : number{
        return this.last_anomaly;
    }
    getLastCheckRequest() : number{
        return this.last_check_request;
    }
    setLastCheckRequest(timestamp:number){
        this.last_check_request = timestamp;
    }

    computeHash() : number
    {
        let hash = 1;

        for (let c = 0; c < this.icao24.length; c++) {
            hash += (this.icao24.charCodeAt(c) * (c+1) * hash) % 1000000000;
        }
        hash += this.start_time;
        hash += this.lat[0]*10e6 + this.lon[0]*10e6;
        hash %= 10e9;

        return hash;
    }

    getHash() : number
    {
        return this.hash;
    }

    getIndiceAtTime(time:number, i:number = 0) : number
    {
        // stocastic search
        let j = this.time.length - 1;

        if (time < this.time[i]) return -1;
        if (time > this.time[j]) return -2;
        let m = 0;

        while (i < j){
            m = Math.floor((i + j) / 2);
            if (this.time[m] < time){
                i = m + 1;
            }
            else{
                j = m;
            }
        }
        return i;
    }

    getIndicesAtTimeRange(start:number, end:number) : [number, number]
    {
        if (start > this.end_time) return [-1, -1];
        if (end < this.start_time) return [-1, -1];

        let i = this.getIndiceAtTime(start);
        if (i == -1) i = 0;

        let j = this.getIndiceAtTime(end, i);
        if (j == -2) j = this.time.length - 1;

        while (j+1 < this.time.length && this.time[j+1] == end){
            j++;
        }
        return [i, j];
    }

    getMessage(i:number):ADSBMessage{
        return {
            timestamp: this.get("time")[i],
            icao24: this["icao24"],
            latitude: this["lat"][i],
            longitude: this["lon"][i],
            groundspeed: this["velocity"][i],
            track: this["heading"][i],
            vertical_rate: this["vertical_rate"][i],
            callsign: this["callsign"][i],
            onground: this["on_ground"][i],
            alert: this["alert"][i],
            spi: this["spi"][i],
            squawk: this["squawk"][i],
            altitude: this["baro_altitude"][i],
            geoaltitude: this["geo_altitude"][i]
        }
    }



    getLatLngs() : [number,number][]
    {
        let latlngs:[number,number][] = [];
        for (let i = 0; i < this.lat.length; i++) {
            if (!Number.isNaN(this.lat[i])  && !Number.isNaN(this.lon[i])){
                latlngs.push([this.lat[i], this.lon[i]]);
            }
        }
        return latlngs;
    }
    getbounds() : L.LatLngBounds
    {
        let latlngs = this.getLatLngs();
        let bounds = L.latLngBounds(latlngs);
        return bounds;
    }





    getStartTimestamp() : number
    {
        return this.start_time;
    }
    getEndTimestamp() : number
    {
        return this.end_time;
    }


    getMapData(timestamp:number=undefined, end:number=undefined):Array<MapMessage>
    {

        const BASE_COLOR = "#184296";
        const NOT_COLOR = "#44bd32";
        const TRUE_COLOR = "#e84118";
        const MAX_LENGTH = 10000;

        let res:Array<MapMessage> = [];
        let sub_flights:{[key:string]:number} = {};

        if (end == undefined){
            if (timestamp > this.end_time)
                return res;

            end = timestamp;
            timestamp = 0;
        }

        if (timestamp > this.end_time || end < this.start_time){
            return res;
        }
        // if it's the case gather all data
        // let coords:[number, number][] = [];
        // let display_opt:{[key:string]:any[]} = {"color": [], "weight": []};

        let [i, j] = this.getIndicesAtTimeRange(timestamp, end);

        if (j - i > MAX_LENGTH){
            i = j - MAX_LENGTH;
        }

        // compute sub-flights
        for (let t=i; t <= j; t++){
            let tag = this.tag[t];
            let flight_i = sub_flights[tag];
            if (flight_i == undefined){
                sub_flights[tag] = res.length;
                let tag_hash = 0
                if (tag != "")
                    tag_hash = parseInt(tag.split("_")[1]) + 1;
                res.push({
                    "type": this.type,
                    "flight_hash": this.hash,
                    "icao24": this.icao24,
                    "tag_hash": tag_hash,
                    "coords": [],
                    "rotation":  0,
                    "start_time": this.start_time,
                    "end_time": this.end_time,
                    "display_opt": {"color": [], "weight": []},
                });
            }
        }

        for (let t=i; t <= j; t++){
            let flight_i = sub_flights[this.tag[t]];

            res[flight_i].coords.push([this.lat[t], this.lon[t]]);
            res[flight_i].rotation = this.heading[t];

            if (this.anomaly[t] == undefined){
                res[flight_i].display_opt["color"].push(BASE_COLOR);
                res[flight_i].display_opt["weight"].push(2);
            }
            else if (this.anomaly[t]){
                res[flight_i].display_opt["color"].push(TRUE_COLOR);
                res[flight_i].display_opt["weight"].push(3);
            }
            else{
                res[flight_i].display_opt["color"].push(NOT_COLOR);
                res[flight_i].display_opt["weight"].push(3);
            }

            i++;
        }

        return res
    }


    public getDataToDisplay(timestamp)
    {
        let i = this.getIndiceAtTime(timestamp);
        if (i == -1) i = 0;
        if (i == -2) i = this.time.length - 1;

        return {
            "callsign": this.callsign[i],
            "icao24": this.icao24,
            "velocity": this.velocity[i],
            "heading": this.heading[i],
            "altitude": (this.baro_altitude[i] + this.geo_altitude[i])/2.0,
            "vertical_rate": this.vertical_rate[i],
            "on_ground": this.on_ground[i],
            "squawk": this.squawk[i],
            "alert": this.alert[i],
            "spi": this.spi[i],
        }
    }

    public getAttributeProfile(attribute:string, timestamp:number, min_timestamp_history:number) : {timestamps:number[], values:number[]}
    {
        let [i, j] = this.getIndicesAtTimeRange(timestamp - min_timestamp_history, timestamp);
        if (j == -1) return {timestamps:[], values:[]};

        let profile:{timestamps:number[], values:number[]} = {timestamps:[], values:[]};
        for (i; i < j; i++){
            profile.timestamps.push(this.time[i]);
            profile.values.push(this[attribute][i]);
        }
        return profile;
    }


    public getType() : AircraftType
    {
        return this.type;
    }

    // overlead the [] operator
    public get(attribute:string) : any
    {
        if (attribute=="time") return this.time;
        if (attribute=="icao24") return this.icao24;
        if (attribute=="lat") return this.lat;
        if (attribute=="lon") return this.lon;
        if (attribute=="velocity") return this.velocity;
        if (attribute=="heading") return this.heading;
        if (attribute=="vertical_rate") return this.vertical_rate;
        if (attribute=="callsign") return this.callsign;
        if (attribute=="on_ground") return this.on_ground;
        if (attribute=="alert") return this.alert;
        if (attribute=="spi") return this.spi;
        if (attribute=="squawk") return this.squawk;
        if (attribute=="baro_altitude") return this.baro_altitude;
        if (attribute=="geo_altitude") return this.geo_altitude;
        return undefined;

    }
}

export default Flight;