import * as L from 'leaflet';

// manage the data of a flight
// - parse the file aircraft.txt containing the list of aircraft types
// - parse flight files from .csv (and soon .db and others ...)
// - auto-detect the aircraft type
// - store all the data of a flight in a FlightData object






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


function getAircraftType(callsign:string, icao24:string) : AircraftType
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
    private filename:string =  ""
    private type:AircraftType =  AircraftType.UNKNOWN;


    constructor()
    {
        
    }

    
    loadFromFile(filename:string, file_content:string) : boolean
    {
        this.filename = filename

        if (filename.endsWith(".csv")){
            return this.loadFromCSV(file_content);
        }
        else{
            return false;
        }
    }

    loadFromCSV(file_content:string) : boolean
    {
        // split the file content into lines
        file_content = file_content.trim();
        var lines = file_content.split('\n');

        // first line is the header
        var header = lines[0].split(',');

        var data:string[][] = [];
        for (var i = 1; i < lines.length; i++) {
            var line:string[] = lines[i].split(',');
            data.push(line);
        }

        // loop through the header and assign the data to the correct array
        for (var c = 0; c < header.length; c++) {
            var column = header[c];
            if (column == "time"){
                for (var i = 0; i < data.length; i++) {
                    this.time.push(parseInt(data[i][c]));
                }
            }
            else if (column == "icao24"){
                this.icao24 = data[0][c];
            }
            else if (column == "lat"){
                for (var i = 0; i < data.length; i++) {
                    this.lat.push(parseFloat(data[i][c]));
                }
            }
            else if (column == "lon"){
                for (var i = 0; i < data.length; i++) {
                    this.lon.push(parseFloat(data[i][c]));
                }
            }
            else if (column == "velocity"){
                for (var i = 0; i < data.length; i++) {
                    this.velocity.push(parseFloat(data[i][c]));
                }
            }
            else if (column == "heading"){
                for (var i = 0; i < data.length; i++) {
                    this.heading.push(parseFloat(data[i][c]));
                }
            }
            else if (column == "vertrate"){
                for (var i = 0; i < data.length; i++) {
                    this.vertical_rate.push(parseFloat(data[i][c]));
                }
            }
            else if (column == "callsign"){
                this.callsign = data[0][c];
            }
            else if (column == "onground"){
                for (var i = 0; i < data.length; i++) {
                    // convert to boolean
                    if (data[i][c] == "true"){
                        this.on_ground.push(true);
                    }
                    else{
                        this.on_ground.push(false);
                    }
                    
                }
            }
            else if (column == "alert"){
                for (var i = 0; i < data.length; i++) {
                    // convert to boolean
                    if (data[i][c] == "true"){
                        this.alert.push(true);
                    }
                    else{
                        this.alert.push(false);
                    }
                }
            }
            else if (column == "spi"){
                for (var i = 0; i < data.length; i++) {
                    // convert to boolean
                    if (data[i][c] == "true"){
                        this.spi.push(true);
                    }
                    else{
                        this.spi.push(false);
                    }
                }
            }
            else if (column == "squawk"){
                for (var i = 0; i < data.length; i++) {
                    this.squawk.push(parseInt(data[i][c]));
                }
            }
            else if (column == "baroaltitude"){
                for (var i = 0; i < data.length; i++) {
                    this.baro_altitude.push(parseFloat(data[i][c]));
                }
            }
            else if (column == "geoaltitude"){
                for (var i = 0; i < data.length; i++) {
                    this.geo_altitude.push(parseFloat(data[i][c]));
                }
            }
            else if (column == "lastposupdate"){
                for (var i = 0; i < data.length; i++) {
                    this.last_pos_update.push(parseFloat(data[i][c]));
                }
            }
            else if (column == "lastcontact"){
                for (var i = 0; i < data.length; i++) {
                    this.last_contact.push(parseFloat(data[i][c]));

                }
            }
            else if (column == "hour"){
                for (var i = 0; i < data.length; i++) {
                    this.hour.push(parseInt(data[i][c]));
                }
            }
        }

        // check required columns
        if (this.icao24 == "" && this.callsign.length == 0){
            return false;
        }
        if (this.lat.length == 0 || this.lon.length == 0){
            return false;
        }
        if (this.time.length == 0){
            return false;
        }
        if (this.baro_altitude.length == 0 && this.geo_altitude.length == 0){
            return false;
        }

        this.start_time = this.time[0];
        this.end_time = this.time[this.time.length - 1];

        this.type = getAircraftType(this.callsign, this.icao24);
        
        return true;
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
        if (time < this.start_time){
            return [];
        }
        if (time > this.end_time){
            return [];
        }

        var latlngs:[number,number][] = [];
        var i = 0;
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
        while (this.time[i] < time){
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
        {type: AircraftType;callsign: string;icao24: string;coords: [number, number][];rotation:number[];start_time: number;end_time: number;}
    {
        if (timestamp == undefined){
            timestamp = this.end_time;
        }
        if (end == undefined){
            // check if timestamp is in range
            
            if (timestamp > this.end_time || timestamp < this.start_time){
                return {"type": AircraftType.UNKNOWN,"callsign": "NULL","icao24": "NULL","coords": [], "rotation":[],"start_time": -1,"end_time": -1,};
            }
            // if it's the case gather all data
            var coords:[number, number][] = [];
            var rot:number[] = [];
            var i = 0;
            while (i < this.time.length && this.time[i] <= timestamp){
                coords.push([this.lat[i], this.lon[i]]);
                rot.push(this.heading[i]);
                i++;
            }
            
            
            return {
                "type": this.type,
                "callsign": this.callsign,
                "icao24": this.icao24,
                "coords": coords,
                "rotation": rot,
                "start_time": this.start_time,
                "end_time": this.end_time,
            };
        }
        else
        {
            if (timestamp > this.end_time || timestamp < this.start_time){
                return {"type": AircraftType.UNKNOWN,"callsign": "NULL","icao24": "NULL","coords": [], "rotation":[],"start_time": -1,"end_time": -1,};
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
                "rotation": this.heading,
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