import { FlightMap } from "./FlightMap";
import { replays } from "./Replays";
import { loadFromCSV } from "./parsers/parse_csv";
import Flight, { AircraftType } from "./Flight";
import { TimeManager } from "./TimeManager";
import { FlightDB } from "./FlightDB";
import { MultiADSBMessage } from "./Types";
import {always, and, Engine, saturation, target} from "@dapia-project/alteration-ts";



export enum AttackType {
    NONE = -1,
    SPOOFING = 0,
    SATURATION = 1,
    REPLAY = 2
}

let replay_icao = 0

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


const SAMU = ["39ac45", "39ac44", "39ac43"];
const MEDIUM = ["3919ac", "39ce53", "391735"];


export class FlightAttack {
    private html_attacks: Array<HTMLElement>;
    private selected_attack: AttackType = AttackType.NONE;
    private replay_db: Array<MultiADSBMessage> = [];
    private ith_replay: number = 0;


    private map: FlightMap;
    private timeManager: TimeManager;
    private flightDB: FlightDB;

    private is_open:boolean = false;


    constructor() {
        this.html_attacks = Array.from(document.querySelectorAll('#window-flight-attack .attack'));
        for (let i = 0; i < this.html_attacks.length; i++) {
            this.html_attacks[i].addEventListener('click', (event) => this.select_attack(i));
        }
        setTimeout(() => {
            this.load_replays();
        }, 1000);

        // generate seed for ith_replay
        this.ith_replay = Math.floor(Math.random() * this.replay_db.length);
    }

    public open(){
        document.getElementById("window-flight-attack").style.display = "flex";
        this.is_open = true;
    }
    public close(){
        document.getElementById("window-flight-attack").style.display = "none";
        this.is_open = false;
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


    public select_attack(i: number) {
        if (i != AttackType.NONE &&
            this.html_attacks[i].classList.contains('selected')) {
            this.html_attacks[i].classList.remove('selected');
            this.selected_attack = AttackType.NONE;
        } else {
            for (const element of this.html_attacks) {
                element.classList.remove('selected');
            }
            this.selected_attack = i;
            if (i != AttackType.NONE) {
                this.html_attacks[i].classList.add('selected');
                this.make_attack_on_change();
            }
        }
    }

    public get_selected_attack() {
        return this.selected_attack;
    }

    private unselect_all() {
        for (const element of this.html_attacks) {
            element.classList.remove('selected');
        }
    }

    public make_attack_on_change() {
        if (!this.is_open) return;
        let selected_flight = this.map.getHighlightedFlight();
        if (selected_flight != -1) {

            console.log(selected_flight, this.flightDB.getAllHashes());

            if (this.selected_attack == AttackType.SPOOFING) {
                this.make_spoofing(selected_flight);
            } else if (this.selected_attack == AttackType.SATURATION) {
                console.log("saturation");
                this.make_saturation(selected_flight);
            }
        }
    }

    public map_clicked(event: L.LeafletMouseEvent) {
        if (!this.is_open) return;
        if (this.selected_attack == AttackType.REPLAY) {
            this.create_replay(event.latlng.lat, event.latlng.lng);
        }
    }

    public flight_clicked(flight_hash: number) {

        if (this.selected_attack == AttackType.SPOOFING) {
            this.make_spoofing(flight_hash);
        } else if (this.selected_attack == AttackType.SATURATION) {

            this.make_saturation(flight_hash);
        }

        this.select_attack(AttackType.NONE);
    }


    public create_replay(lat: number, lon: number) {
        replay_icao++;
        let data: MultiADSBMessage = this.replay_db[this.ith_replay]


        this.ith_replay++;
        if (this.ith_replay >= this.replay_db.length) {
            this.ith_replay = 0;
        }

        let dlat = lat - data.latitude[0];
        let dlon = lon - data.longitude[0];
        // random track
        let dtrack = Math.random() * 360;
        [data.latitude, data.longitude, data.track] = translate_rotate(data.latitude, data.longitude, data.track, dlat, dlon, dtrack);
        let timestamp = Math.floor(this.timeManager.getTimestamp());
        data.timestamp = set_start_timestamp(data.timestamp, timestamp);

        let flight = new Flight();
        data.icao24 = "rep" + replay_icao.toString().padStart(4, '0');
        flight.setAttribute(data)
        this.flightDB.addFlight(flight);

        this.flightDB.recalculate_db();
        this.flightDB.recalculate_display();
        this.map.update(this.timeManager.getTimestamp(), this.timeManager.getTimestamp());
    }

    public make_spoofing(flight_hash: number) {

        let flight = this.flightDB.findFlight(flight_hash);

        if (flight.getType() != AircraftType.SAMU) {
            flight.spoof_icao(SAMU[Math.floor(Math.random() * SAMU.length)]);
        } else {
            flight.spoof_icao(MEDIUM[Math.floor(Math.random() * MEDIUM.length)]);
        }

        this.flightDB.recalculate_db();
        this.flightDB.recalculate_display();
        this.map.update(this.timeManager.getTimestamp(), this.timeManager.getTimestamp());
    }

    public make_saturation_(flight_hash: number) {
        let flight = this.flightDB.findFlight(flight_hash);
        if (flight.getTagsHashes().length > 1) {
            return;// already saturated
        }

        let time = Math.floor(this.timeManager.getTimestamp());
        let i = flight.getIndiceAtTime(time);

        let length = flight["time"].length;
        let lats = flight["lat"].slice(i);
        let lons = flight["lon"].slice(i);
        let tracks = flight["heading"].slice(i);

        const devs_ = [[45, 30, 15, -15, -30, -45], [60, 45, 30, 15, -15, -30], [30, 15, -15, -30, -45, -60], [75, 60, 45, 30, 15, -15], [15, -15, -30, -45, -60, -75]];
        let devs = devs_[Math.floor(Math.random() * devs_.length)];

        let deviant_data = [];
        for (const dev of devs) {
            let [dlats, dlons, dtracks] = translate_rotate(lats, lons, tracks, 0.0, 0.0, dev);
            deviant_data.push([dlats, dlons, dtracks]);
        }


        for (let t = length - 1; t >= i; t--){
            let ith = t - i;
            for (let j = 0; j < deviant_data.length; j++) {
                flight.insert_message_for_saturation(t,
                    deviant_data[j][0][ith], deviant_data[j][1][ith], deviant_data[j][2][ith]);
                flight.setTag(t, (j+1).toString())
            }
        }

        this.map.update(this.timeManager.getTimestamp(), this.timeManager.getTimestamp());
    }

    public make_saturation(flight_hash: number) {
        let flight = this.flightDB.findFlight(flight_hash);
        if (flight.getTagsHashes().length > 1) {
            return;// already saturated
        }
        const engine = new Engine({
            actions: [
                saturation({
                    scope: and(always, target(flight.icao24)),
                    aircrafts: 6,
                    angleMax: 45,
                })
            ]
        })
        let time = Math.floor(this.timeManager.getTimestamp());
        const messages = flight.getMessages(time)
        const result = engine.run(messages.map(message => ({
            ...message,
            messageType: 'MSG',
            transmissionType: 3,
            sessionID: 0,
            aircraftID: flight.getHash(),
            flightID: flight.getHash(),
            hexIdent: flight.icao24,
            timestampGenerated: message.timestamp,
            timestampLogged: message.timestamp,
        })))
        const ghosts: Map<string, number[][]> = new Map()
        for (const message of result.recording) {
            if (!ghosts.has(message.hexIdent)) {
                ghosts.set(message.hexIdent, [])
            }
            ghosts.get(message.hexIdent).push([message.latitude, message.longitude, message.track])
        }
        let i = flight.getIndiceAtTime(time);

        let deviant_data = [];
        for (const [icao, coordinates] of Array.from(ghosts.entries())) {
            if(icao !== flight.icao24) {
                const lats = coordinates.map(coords => coords[0])
                const lons = coordinates.map(coords => coords[1])
                const tracks = coordinates.map(coords => coords[2])
                deviant_data.push([lats, lons, tracks])
            }
        }

        let length = flight["time"].length;
        for (let t = length - 1; t >= i; t--) {
            let ith = t - i;
            for (let j = 0; j < deviant_data.length; j++) {
                flight.insert_message_for_saturation(t,
                    deviant_data[j][0][ith], deviant_data[j][1][ith], deviant_data[j][2][ith]);
                flight.setTag(t, (j + 1).toString())
            }
        }

        this.map.update(this.timeManager.getTimestamp(), this.timeManager.getTimestamp());
    }

    update_stats() {
        let [valid, invalid] = this.flightDB.getAnomalyStats()
        document.getElementById("nb-valid-aircraft").innerText = valid.toString();
        document.getElementById("nb-invalid-aircraft").innerText = invalid.toString();
    }
}
