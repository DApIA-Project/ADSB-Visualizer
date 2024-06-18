import {FlightDB} from "./FlightDB";
import axios from 'axios';

export type JsonMessage = Record<string, string | boolean | number | undefined>
export type ResultDetection = {timestamp:number, icao24:string, latitude:number, longitude:number, groundspeed:number, track:number, vertical_rate:number, callsign:string, onground:boolean, alert:boolean, spi:boolean, squawk:number, altitude:number, geoaltitude:number, replay:boolean, flooding:boolean, spoofing:boolean}
export type ApiResponse = {data : [{timestamp:number, icao24:string, latitude:number, longitude:number, groundspeed:number, track:number, vertical_rate:number, callsign:string, onground:boolean, alert:boolean, spi:boolean, squawk:number, altitude:number, geoaltitude:number, replay:boolean, flooding:boolean, spoofing:boolean}]}
export type AxiosCallback = (message: JsonMessage[]) => Promise<ApiResponse>
export class AnomalyChecker {

    public async checkAnomaly(flight_db: FlightDB, timestamp: number, time_speed : number) : Promise<ResultDetection[]> {
        let arrayMessage: JsonMessage[] = flight_db.getMessages(timestamp,time_speed).messages
        let arrayResult : ResultDetection[] = []
        if(arrayMessage != undefined){
            let request: AxiosCallback = async (message): Promise<ApiResponse> => {
                try {
                    console.log("request : ",message);
                    return await axios.post("http://127.0.0.1:3033/", {message})
                } catch (e) {
                    console.log(e)
                }
            }

            let result = await request(arrayMessage);


            if(result !== undefined){
                for (const dataElement of result.data) {
                    arrayResult.push({
                        timestamp : Number(dataElement['timestamp']),
                        icao24 : String(dataElement['icao24']),
                        latitude : Number(dataElement['latitude']),
                        longitude : Number(dataElement['longitude']),
                        groundspeed : Number(dataElement['groundspeed']),
                        track : Number(dataElement['track']),
                        vertical_rate : Number(dataElement['vertical_rate']),
                        callsign : String(dataElement['callsign']),
                        onground : Boolean(dataElement['onground']),
                        alert : Boolean(dataElement['alert']),
                        spi : Boolean(dataElement['spi']),
                        squawk : Number(dataElement['squawk']),
                        altitude : Number(dataElement['altitude']),
                        geoaltitude : Number(dataElement['geoaltitude']),
                        replay : Boolean(dataElement['replay']),
                        flooding : Boolean(dataElement['flooding']),
                        spoofing : Boolean(dataElement['spoofing'])
                    })
                }

            }

        }
        return arrayResult

    }
}