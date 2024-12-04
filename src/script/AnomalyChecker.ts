import axios from 'axios';
import { ApiRequest, ApiResponse } from "./Types";
import { FlightDB } from './FlightDB';

export class AnomalyChecker {


    private database:FlightDB
    private server_inactivity:number = 0;
    private server_inactive:boolean = false;
    private last_request = -1;

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
        console.log("Server inactive", this.server_inactive);
        
        return this.server_inactive;
    }

    public resetFlights(icaos: string[]){
        try{
            let json = {
                icaos: icaos,
                order: this.last_request + 1
            }
            console.log("send reset request", this.last_request + 1);
            this.last_request++;
            axios.post("http://127.0.0.1:3033/reset", json, {responseType: 'json'});
        }
        catch(e){
            console.log(e);
        }
    }

    public checkMessages(messages:ApiRequest): Promise<boolean> {
        
        if(messages == undefined || messages.data.length == 0) return Promise.resolve(false);

 


        this.last_request++;
        let json = {
            messages: messages.data,
            order: this.last_request
        }
        console.log("send checkmessage at", this.last_request, messages.data[0].timestamp%3600, "-", messages.data[messages.data.length-1].timestamp%3600);
        return axios.post("http://127.0.0.1:3033/", json, {responseType: 'json'}).then((result) => {
            console.log("checkmessage at", this.last_request, messages.data[0].timestamp%3600, "-", messages.data[messages.data.length-1].timestamp%3600, "done");
            this.server_inactivity = 0;
            return this.applyAnomaly(result, messages);7
            
        }).catch((e) => {;
            this.server_inactivity++;

            document.getElementById("server-status").innerText = "help";
            document.getElementById("server-status").className = "btn-alert material-symbols-outlined"
            console.log("this.server_inactivit", this.server_inactivity);
            
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
            return false;
        });
    }

    private applyAnomaly(result:ApiResponse, messages:ApiRequest){


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

                document.getElementById("server-status").innerText = "check_circle";
                document.getElementById("server-status").className = "btn-valid material-symbols-outlined"

            }
            return true;


        }
        return false;
    }
}