import Flight, { AircraftType } from "./Flight";

export type ADSBMessage = {timestamp:number, icao24:string, latitude:number, longitude:number, groundspeed:number, track:number, vertical_rate:number, callsign:string, onground:boolean, alert:boolean, spi:boolean, squawk:number, altitude:number, geoaltitude:number};
export type MapMessage = {type: AircraftType;flight_hash:number;icao24: string;tag_hash:number;coords: [number, number][];rotation:number;start_time: number;end_time: number, display_opt: {[key:string]:any[]}};

export type ApiRequest = {data : ADSBMessage[], flight_hash:number[], flight_t:number[]};
export type ApiResponse = {data : {tag:string, replay:boolean, flooding:boolean, spoofing:boolean}[]};