import { FlightDB } from "./FlightDB";




export class Streamer{

    // http://femto-avion.iut-bm.univ-fcomte.fr/aircraftlist.json?srcpref=A&vpn=43.11581&vpe=0.72561&vps=44.07449&vpw=2.16344&knownposonly=1&srcexcl=D&srcexcl=F&srcexcl=L&srcexcl=O
    private interval = undefined;
    private flight_db: FlightDB = undefined;


    // link to the flight list
    public setFlightDB(flight_db: FlightDB) : void{
        this.flight_db = flight_db;
    }

    listenOpenSkyStream(minLatitude: number, minLongitude: number, maxLatitude: number, maxLongitude: number){
        // this.interval = setInterval(async () => {
        //     // http request
        //     let response = await fetch(`https://opensky-network.org/api/states/all?extended=true&lamin=${minLatitude}&lomin=${minLongitude}&lamax=${maxLatitude}&lomax=${maxLongitude}`)
        //     let data = response.json();
        //     this.updateOpenSkyStream(data);

        // }, 1000);
    }
    updateOpenSkyStream(response: any){

    }


    listenFemtoAvionStream(){
        let fails = 0;
        this.interval = setInterval(async () => {
            // http request
            try{
                let response = await fetch(`http://femto-avion.iut-bm.univ-fcomte.fr/aircraftlist.json&knownposonly=1&srcexcl=D&srcexcl=F&srcexcl=L&srcexcl=O`, { signal: AbortSignal.timeout(5000) })
                let data = await response.json();
                this.updateFemtoAvionStream(data);
                fails = 0;
            }catch(e){
                fails++;
                if (fails > 10){
                    clearInterval(this.interval);
                    console.log("FemtoAvion stream is inactive");
                }
            }

        }, 1000);
    }
    updateFemtoAvionStream(data: any){

        for (let i = 0; i < data.length; i++) {
            let aircraft = data[i];
            let timestamp = aircraft["uti"];
            let icao24= aircraft["hex"];
            let latitude= aircraft["lat"];
            let longitude= aircraft["lon"];
            let groundspeed= aircraft["spd"];
            let track= aircraft["trk"];
            let vertical_rate= aircraft["vrt"];
            let callsign= aircraft["reg"];
            let onground=false;
            let alert=aircraft["alr"] == 1;
            let spi=aircraft["spi"];
            let squawk=aircraft["squ"];
            let altitude=aircraft["alt"];
            let geoaltitude=aircraft["altg"];
            this.flight_db.addMessage(timestamp, icao24, latitude, longitude, groundspeed, track, vertical_rate, callsign, onground, alert, spi, squawk, altitude, geoaltitude);
        }
    }


}