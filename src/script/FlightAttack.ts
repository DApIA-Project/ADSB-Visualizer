import { FlightMap } from "./FlightMap";
import * as fs from 'fs';
import { replays } from "./Replays";
import { loadFromCSV } from "./parsers/parse_csv";
import Flight from "./Flight";
import { TimeManager } from "./TimeManager";
import { FlightDB } from "./FlightDB";
import { MultiADSBMessage } from "./Types";



enum AttackType {
    NONE = -1,
    SPOOFING = 0,
    SATURATION = 1,
    REPLAY = 2
}


// |====================================================================================================================
// | ANOMALY GENERATION
// |====================================================================================================================


function radians(degrees: number): number {
    return degrees * Math.PI / 180;
}
function degrees(radians: number): number {
    return radians * 180 / Math.PI;
}

function x_rotation(x: number, y: number, z: number, a: number): [number, number, number] {
    return [x, y * Math.cos(-a) - z * Math.sin(-a), y * Math.sin(-a) + z * Math.cos(-a)];
}
function y_rotation(x: number, y: number, z: number, a: number): [number, number, number] {
    return [x * Math.cos(-a) + z * Math.sin(-a), y, -x * Math.sin(-a) + z * Math.cos(-a)];
}
function z_rotation(x: number, y: number, z: number, a: number): [number, number, number] {
    return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z];
}

function spherical_to_cartesian(lat: number, lon: number): [number, number, number] {
    let x = Math.cos(radians(lon)) * Math.cos(radians(lat));
    let y = Math.sin(radians(lon)) * Math.cos(radians(lat));
    let z = Math.sin(radians(lat));
    return [x, y, z];
}
function cartesian_to_spherical(x: number, y: number, z: number): [number, number] {
    let lat = degrees(Math.asin(z));
    let lon = degrees(Math.atan2(y, x));
    return [lat, lon];
}

function translate_rotate(lats: number[], lons: number[], tracks: number[], lat, lon, track): [number[], number[], number[]] {
    // cpy lats, lons, tracks
    let transform_lats = [...lats];
    let transform_lons = [...lons];
    let transform_tracks = [...tracks];

    let [lat_trg, lon_trg] = [lats[0] + lat, lons[0] + lon];

    for (let i = 0; i < lats.length; i++) {
        let [x, y, z] = spherical_to_cartesian(lats[i], lons[i]);
        [x, y, z] = z_rotation(x, y, z, radians(-lons[0]));
        [x, y, z] = y_rotation(x, y, z, radians(-lats[0]));
        if (i == 0) console.log(x, y, z);
        [x, y, z] = x_rotation(x, y, z, radians(track));
        [x, y, z] = y_rotation(x, y, z, radians(lat_trg));
        [x, y, z] = z_rotation(x, y, z, radians(lon_trg));
        [transform_lats[i], transform_lons[i]] = cartesian_to_spherical(x, y, z);
        transform_tracks[i] = (transform_tracks[i] + track) % 360;
    }
    return [transform_lats, transform_lons, transform_tracks];
}

function set_start_timestamp(timestamps: number[], start_timestamp: number) {
    let t0 = timestamps[0];
    for (let i = 0; i < timestamps.length; i++) {
        timestamps[i] = timestamps[i] - t0 + start_timestamp;
    }
    return timestamps;
}


export class FlightAttack {
    private html_attacks: Array<HTMLElement>;
    private selected_attack: AttackType = AttackType.REPLAY;
    private replay_db: Array<MultiADSBMessage> = [];
    private ith_replay: number = 0;


    private map: FlightMap;
    private timeManager: TimeManager;
    private flightDB: FlightDB;



    constructor() {
        this.html_attacks = Array.from(document.querySelectorAll('#window-flight-attack a'));
        for (let i = 0; i < this.html_attacks.length; i++) {
            this.html_attacks[i].addEventListener('click', (event) => this.select_attack(i));
        }
        setTimeout(() => {
            this.load_replays();
        }, 1000);

        // generate seed for ith_replay
        this.ith_replay = Math.floor(Math.random() * this.replay_db.length);
    }


    private load_replays() {
        for (const replay of replays) {
            fetch(replay).then(async (response) => {
                let file_content = await response.text();
                let data = loadFromCSV("__memory__.csv", file_content);
                this.replay_db.push(data[0]);
            });
        }
    }



    public setMap(map: FlightMap) {
        this.map = map;
        this.map.addOnClickListener((event) => this.map_clicked(event));
    }
    public setTimeManager(timeManager: TimeManager) {
        this.timeManager = timeManager;
    }
    public setFlightDB(flightDB: FlightDB) {
        this.flightDB = flightDB;
    }




    private select_attack(i: number) {
        if (this.html_attacks[i].classList.contains('selected')) {
            this.html_attacks[i].classList.remove('selected');
            this.selected_attack = AttackType.NONE;
        }
        else {
            for (const element of this.html_attacks) {
                element.classList.remove('selected');
            }
            this.html_attacks[i].classList.add('selected');
            this.selected_attack = i;
        }
    }
    private unselect_all() {
        for (const element of this.html_attacks) {
            element.classList.remove('selected');
        }
    }

    public map_clicked(event: L.LeafletMouseEvent) {
        console.log(event);
        console.log("a", this.selected_attack);

        if (this.selected_attack == AttackType.REPLAY) {
            this.create_replay(event.latlng.lat, event.latlng.lng);
        }
    }

    public create_replay(lat: number, lon: number) {
        let data:MultiADSBMessage = this.replay_db[this.ith_replay]


        this.ith_replay++;
        if (this.ith_replay >= this.replay_db.length) {
            this.ith_replay = 0;
        }
        console.log("click in", lat, lon);

        let dlat = lat - data.latitude[0];
        let dlon = lon - data.longitude[0];
        // random track
        let dtrack = Math.random() * 360;
        [data.latitude, data.longitude, data.track] = translate_rotate(data.latitude, data.longitude, data.track, dlat, dlon, dtrack);
        let timestamp = Math.ceil(this.timeManager.getTimestamp());
        data.timestamp = set_start_timestamp(data.timestamp, timestamp);
        console.log(data);

        let flight = new Flight();
        flight.setAttribute(data)
        this.flightDB.addFlight(flight);
        this.flightDB.recalculate_db();
        this.flightDB.recalculate_display();

    }
}