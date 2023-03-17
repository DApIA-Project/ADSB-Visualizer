

import {Map} from './Map';
import {FlightDB} from './FlightDB';
import {InputReader} from './InputReader';
import { TimeManager } from './TimeManager';


// initalize everything when the page is loaded
// and setup the class dependencies (ex: map needs flight_db)


window.addEventListener('load', onPageLoad);


// create function
function onPageLoad() {
    // create new map
    var map = new Map();
    // manage the flight list
    var flight_db = new FlightDB();
    // manage the incoming input data (drag-drop)
    var inpurReader = new InputReader();
    // manage the time bar
    var timeManager = new TimeManager();


    map.setFlightDB(flight_db);

    flight_db.setMap(map);
    flight_db.setTimer(timeManager);

    inpurReader.setFlightDB(flight_db);
    inpurReader.setMap(map);

    timeManager.setFlightDB(flight_db);
    timeManager.setMap(map);
    timeManager.setInputReader(inpurReader);
    timeManager.start();




    window.addEventListener('dragover', (e) => {inpurReader.onDragOver(e); });
    window.addEventListener('drop', (e) => { inpurReader.onDrop(e); });
    window.addEventListener('dragenter', (e) => { inpurReader.onDragEnter(e); });
    window.addEventListener('dragleave', (e) => { inpurReader.onDragLeave(e); });
}



