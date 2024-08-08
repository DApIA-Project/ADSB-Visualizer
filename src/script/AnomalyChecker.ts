import axios from 'axios';
import { ApiRequest, ApiResponse } from "./Types";
import { FlightDB } from './FlightDB';


export class AnomalyChecker {

    private database:FlightDB


    public setFlightDB(database:FlightDB){
        this.database = database;
    }

    public async checkMessages(messages:ApiRequest) {
        let anomaly_updated = false;
        if(messages != undefined && messages.data.length > 0){

            let result:ApiResponse =  await axios.post("http://127.0.0.1:3033/", messages.data, {responseType: 'json'});

            if(result !== undefined){

                let data = result.data;

                for (let i = 0; i < data.length; i++) {
                    let message = result.data[i];

                    let flight_hash = messages.flight_hash[i];
                    let flight_t = messages.flight_t[i];

                    let anomaly = (message.replay || message.flooding || message.spoofing);
                    let flight = this.database.findFlight(flight_hash)

                    if (flight == undefined) continue;

                    flight.setAnomaly(flight_t, anomaly)
                    flight.setTag(flight_t, message.tag)
                    anomaly_updated = true;
                }

            }
        }
        return anomaly_updated;
    }
}