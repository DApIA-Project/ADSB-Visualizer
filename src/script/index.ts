

import {FlightMap} from './FlightMap';
import {FlightDB} from './FlightDB';
import {InputReader} from './InputReader';
import { TimeManager } from './TimeManager';
import { FlightInfoDisplayer } from './FlightDataDisplayer';



// initalize everything when the page is loaded
// and setup the class dependencies (ex: map needs flight_db)


window.addEventListener('load', onPageLoad);


// create function
function onPageLoad() {
    // create new map
    var map = new FlightMap();
    // manage the flight list
    var flight_db = new FlightDB();
    // manage the incoming input data (drag-drop)
    var inpurReader = new InputReader();
    // manage the time bar
    var timeManager = new TimeManager();

    var flightInfoDisplayer = new FlightInfoDisplayer();



    map.setFlightDB(flight_db);

    flight_db.setMap(map);
    flight_db.setTimer(timeManager);
    flight_db.setFlightInfoDisplayer(flightInfoDisplayer);

    inpurReader.setFlightDB(flight_db);
    inpurReader.setMap(map);

    timeManager.setFlightDB(flight_db);
    timeManager.setMap(map);
    timeManager.setInputReader(inpurReader);
    timeManager.setFlightInfoDisplayer(flightInfoDisplayer);
    timeManager.start();
    timeManager.startAnomalyChecker();

    inpurReader.loadDefaultExample();


    window.addEventListener("message", (e) => {
        inpurReader.addFile(e.data.filename, e.data.content );
    });

}

