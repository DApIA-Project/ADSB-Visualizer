import {FlightDB} from "./FlightDB";
import axios from 'axios';
import {AxiosCallback, ApiResponse, Recording} from "@dapia-project/recording-streamer/dist/types";
import {streamFile} from "@dapia-project/recording-streamer/dist/streamFile";
import {streamRecording} from "@dapia-project/recording-streamer/dist";

export type JsonMessage = Record<string, string | boolean | number | undefined>
export class AnomalyChecker {
    private flight_db: FlightDB = undefined;

    public setFlightDB(flight_db: FlightDB) : void{
        this.flight_db = flight_db;
    }
    public async checkAnomaly(flight_db: FlightDB, timestamp: number) {
        this.setFlightDB(flight_db)

        let arrayMessage: JsonMessage[] = this.flight_db.getMessages(timestamp).messages
        if(arrayMessage != null){
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
                return result
            }

        }

    }
}