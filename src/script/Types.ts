import Flight, { AircraftType } from "./Flight";

export type ADSBMessage      = {timestamp:number,   icao24:string, latitude:number,   longitude:number,   groundspeed:number,
                                track:number,   vertical_rate:number,   callsign:string,   onground:boolean,   alert:boolean,
                                spi:boolean,   squawk:number,   altitude:number,   geoaltitude:number, tag?:string};

export type MultiADSBMessage = {timestamp:number[], icao24:string, latitude:number[], longitude:number[], groundspeed:number[],
                                track:number[], vertical_rate:number[], callsign:string[], onground:boolean[], alert:boolean[],
                                spi:boolean[], squawk:number[], altitude:number[], geoaltitude:number[], anomaly?:boolean[]};

export function init_MultiADSBMessage(length:number): MultiADSBMessage{
    return {timestamp: Array(length).fill(0), icao24: "", latitude: Array(length).fill(0), longitude: Array(length).fill(0), groundspeed: Array(length).fill(0),
            track: Array(length).fill(0), vertical_rate: Array(length).fill(0), callsign: Array(length).fill(""), onground: Array(length).fill(false), alert: Array(length).fill(false),
            spi: Array(length).fill(false), squawk: Array(length).fill(0), altitude: Array(length).fill(0), geoaltitude: Array(length).fill(0)};
}

export type MapMessage = {type: AircraftType;flight_hash:number;icao24: string;tag_hash:number;coords: [number, number][];rotation:number;start_time: number;end_time: number, anomaly:boolean[]}; //display_opt: {[key:string]:any[]}};

export type ApiRequest = {data : ADSBMessage[], flight_hash:number[], flight_t:number[]};
export type ApiResponse = {data : {tag:string, replay:boolean, flooding:boolean, spoofing:boolean}[]};