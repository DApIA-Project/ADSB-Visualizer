import {FlightDB} from "./FlightDB";
import axios from 'axios';

export type JsonMessage = Record<string, string | boolean | number | undefined>
export type ResultDetection = {timestamp : number, icao24 : string, prediction : string, truth : string}
export type ApiResponse = {data : [{ icao24?: string; timestamp?: number; prediction?: string; truth?: string; messages?: JsonMessage[]; error?: string }]}
export type AxiosCallback = (message: JsonMessage[]) => Promise<ApiResponse>
export class AnomalyChecker {

    public async checkAnomaly(flight_db: FlightDB, timestamp: number, time_speed : number) : Promise<ResultDetection[]> {
        let arrayMessage: JsonMessage[] = flight_db.getMessages(timestamp,time_speed).messages
        let arrayResult : ResultDetection[] = []
        if(arrayMessage != undefined){
            let callback: AxiosCallback
            callback = async (message): Promise<ApiResponse> => {
                try {
                    return await axios.post("http://127.0.0.1:3033/classifier", {message})
                } catch (e) {
                    console.log(e)
                }
            }

            let result = await callback(arrayMessage)
            if(result !== undefined){
                for (const dataElement of result.data) {
                    arrayResult.push({
                        timestamp : Number(dataElement['timestamp']),
                        icao24 : String(dataElement['icao24']),
                        prediction : dataElement['prediction'],
                        truth : dataElement['truth']
                    })
                }

            }

        }
        return arrayResult

    }
}