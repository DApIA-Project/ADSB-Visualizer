

import {FlightMap} from './FlightMap';
import {FlightDB} from './FlightDB';
import {InputReader} from './InputReader';
import { TimeManager } from './TimeManager';
import { FlightInfoDisplayer } from './FlightDataDisplayer';
import { Streamer } from './Streamer';
import { AnomalyChecker } from './AnomalyChecker';
import { FlightAttack } from './FlightAttack';
import { Debugger } from './Debugger';



// initalize everything when the page is loaded
// and setup the class dependencies (ex: map needs flight_db)


window.addEventListener('load', onPageLoad);


// create function
function onPageLoad() {
    // create new map
    let map = new FlightMap();
    // manage the flight list
    let flight_db = new FlightDB();
    // manage the incoming input data (drag-drop)
    let inpurReader = new InputReader();
    // manage the time bar
    let timeManager = new TimeManager();

    let flightInfoDisplayer = new FlightInfoDisplayer();

    let streamer = new Streamer();

    let anomalyChecker = new AnomalyChecker();

    let flightAttack = new FlightAttack();

    let debug = new Debugger();



    map.setFlightDB(flight_db);
    map.setFlightAttack(flightAttack);
    map.setDebugger(debug);

    flight_db.setMap(map);
    flight_db.setTimer(timeManager);
    flight_db.setFlightInfoDisplayer(flightInfoDisplayer);

    inpurReader.setFlightDB(flight_db);
    inpurReader.setMap(map);

    timeManager.setFlightDB(flight_db);
    timeManager.setMap(map);
    timeManager.setInputReader(inpurReader);
    timeManager.setFlightInfoDisplayer(flightInfoDisplayer);
    timeManager.setAnomalyChecker(anomalyChecker);
    timeManager.setFlightAttack(flightAttack);

    streamer.setFlightDB(flight_db);

    anomalyChecker.setFlightDB(flight_db);

    flightAttack.setMap(map);
    flightAttack.setTimeManager(timeManager);
    flightAttack.setFlightDB(flight_db);

    inpurReader.loadDefaultExample();
    timeManager.start();

    debug.setMap(map);

    window.addEventListener("message", (e) => {
        inpurReader.addFile(e.data.filename, e.data.content );
    });
    // streamer.listenFemtoAvionStream();



    document.getElementById("show-attacks").addEventListener("change", (e) => {
        let showAttacks = (e.target as HTMLInputElement).checked;
        if (showAttacks) {
            flightAttack.open();
        } else {
            flightAttack.close();
        }
    });
    document.getElementById("show-debug").addEventListener("change", (e) => {
        let showDebug = (e.target as HTMLInputElement).checked;
        if (showDebug) {
            debug.active();
        } else {
            debug.desactive();
        }
    });
}
