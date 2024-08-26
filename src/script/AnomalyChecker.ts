import axios from 'axios';
import { ApiRequest, ApiResponse } from "./Types";
import { FlightDB } from './FlightDB';


export class AnomalyChecker {

    private database:FlightDB
    private server_inactivity:number = 0;
    private server_inactive:boolean = false;

    public setFlightDB(database:FlightDB){
        this.database = database;
    }

    public isServerInactive(){
        return this.server_inactive;
    }

    public async checkMessages(messages:ApiRequest) {
        let anomaly_updated = false;

        if(messages != undefined && messages.data.length > 0){

            let result:ApiResponse = undefined;
            try{
                result = await axios.post("http://127.0.0.1:3033/", messages.data, {responseType: 'json'});
            }catch(e){
                this.server_inactivity++;
                if(this.server_inactivity > 10){
                    console.log("Server is inactive");
                    this.server_inactive = true;
                }

                console.log(e);
            }

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