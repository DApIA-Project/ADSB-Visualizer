import axios from 'axios';
import { ApiRequest, ApiResponse } from "./Types";
import { FlightDB } from './FlightDB';

export class AnomalyChecker {


    private database:FlightDB
    private server_inactivity:number = 0;
    private server_inactive:boolean = false;

    // constructor
    constructor() {
        document.getElementById("refresh-server-status").addEventListener("click", () => {
            this.server_inactivity = 0;
            this.server_inactive = false;
            document.getElementById("server-status").innerText = "help";
            document.getElementById("server-status").className = "btn-alert material-symbols-outlined"

            document.getElementById("refresh-server-status").style.display = "none";
        });
    }

    public setFlightDB(database:FlightDB){
        this.database = database;
    }

    public isServerInactive(){
        return this.server_inactive;
    }

    public async resetFlights(icaos: string[]){
        console.log(icaos);

        try{
            let result = await axios.post("http://127.0.0.1:3033/reset", icaos, {responseType: 'json'});
            console.log(result);
        }
        catch(e){
            console.log(e);
        }
    }

    public async checkMessages(messages:ApiRequest) {
        if(messages == undefined || messages.data.length == 0) return false;

        let anomaly_updated = false;

        let result:ApiResponse = undefined;
        try{
            result = await axios.post("http://127.0.0.1:3033/", messages.data, {responseType: 'json'});
        }catch(e){
            this.server_inactivity++;

            document.getElementById("server-status").innerText = "help";
            document.getElementById("server-status").className = "btn-alert material-symbols-outlined"

            if(this.server_inactivity > 10){
                console.log("Server is inactive");
                this.server_inactive = true;
                document.getElementById("server-status").innerText = "cancel";
                document.getElementById("server-status").className = "btn-cancel material-symbols-outlined"
                document.getElementById("refresh-server-status").style.display = "block";

            }
            console.log(e);
            for (let i = 0; i < messages.data.length; i++) {
                let flight_hash = messages.flight_hash[i];
                let flight = this.database.findFlight(flight_hash)
                flight.setLastCheckRequest(0)
            }

        }

        if(result !== undefined){

            let data = result.data;

            for (let i = 0; i < data.length; i++) {
                let message = result.data[i];


                let flight_hash = messages.flight_hash[i];
                let flight_t = messages.flight_t[i];

                let anomaly = (message.anomaly != 0);
                let flight = this.database.findFlight(flight_hash)

                if (flight == undefined) continue;

                flight.setAnomaly(flight_t, anomaly)
                flight.setTag(flight_t, message.tag)

                var debug_data = {}
                for (let key in message) {
                    if (key.startsWith("debug")) {
                        debug_data[key] = message[key];
                    }
                }
                flight.setDebugData(flight_t, debug_data)

                anomaly_updated = true;
                document.getElementById("server-status").innerText = "check_circle";
                document.getElementById("server-status").className = "btn-valid material-symbols-outlined"

            }

        }
        return anomaly_updated;
    }
}