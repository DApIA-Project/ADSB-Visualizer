
import * as L from 'leaflet';
import "leaflet-rotatedmarker";
import "leaflet/dist/leaflet.css";

import { MultiColorPolyLine } from './MultiColorPolyLine';

import * as URL from './Url'

// manage the display of the map
// - display the map
// - display the flight path using polylines
// - display the aircraft icons using markers


// declare module 'leaflet' {
//     interface MarkerOptions {
//         rotationAngle?: number | undefined; // Rotation angle, in degrees, clockwise. (Default = 0)
//         rotationOrigin?: string | undefined; // The rotation center, as a transform-origin CSS rule. (Default = 'bottom center')
//     }

//     interface Marker {
//         /*
//         * Sets the rotation angle value.
//         */
//         setRotationAngle(newAngle: number): this;

//         /**
//          * Sets the rotation origin value.
//          */
//         setRotationOrigin(newOrigin: string): this;
//     }
// }

import { Flight, AircraftType } from './Flight';
import { FlightDB } from './FlightDB';
import { MapMessage } from './Types';
import { AttackType, FlightAttack } from './FlightAttack';

// export enum AircraftType {
//     UNKNOWN = 0,
//     CARGO,
//     PLANE,
//     JET,
//     TURBOPROP,
//     MEDIUM,
//     LIGHT,
//     SUPER_LIGHT,
//     GLIDER,
//     HELICOPTER,
//     ULM,
//     MILITARY,
//     SAMU,
//     GROUND_VEHICLE,
//     DRONE,
// }


const unknown_img = L.icon({iconUrl: URL.unknown,iconSize: [30, 30],iconAnchor: [15, 15],});
const unknown_img_flip = L.icon({iconUrl: URL.unknown_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
const cargo_img = L.icon({iconUrl: URL.cargo,iconSize: [30, 30],iconAnchor: [15, 15],});
const cargo_img_flip = L.icon({iconUrl: URL.cargo_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
const plane_img = L.icon({iconUrl: URL.plane,iconSize: [30, 30],iconAnchor: [15, 15],});
const plane_img_flip = L.icon({iconUrl: URL.plane_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
const jet_img = L.icon({iconUrl: URL.jet,iconSize: [30, 30],iconAnchor: [15, 15],});
const jet_img_flip = L.icon({iconUrl: URL.jet_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
const turboprop_img = L.icon({iconUrl: URL.turboprop,iconSize: [30, 30],iconAnchor: [15, 15],});
const turboprop_img_flip = L.icon({iconUrl: URL.turboprop_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
const medium_img = L.icon({iconUrl: URL.medium,iconSize: [30, 30],iconAnchor: [15, 15],});
const medium_img_flip = L.icon({iconUrl: URL.medium_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
const light_img = L.icon({iconUrl: URL.light,iconSize: [30, 30],iconAnchor: [15, 15],});
const light_img_flip = L.icon({iconUrl: URL.light_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
const super_light_img = L.icon({iconUrl: URL.super_light,iconSize: [30, 30],iconAnchor: [15, 15],});
const super_light_img_flip = L.icon({iconUrl: URL.super_light_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
const glider_img = L.icon({iconUrl: URL.glider,iconSize: [30, 30],iconAnchor: [15, 15],});
const glider_img_flip = L.icon({iconUrl: URL.glider_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
const helicopter_img = L.icon({iconUrl: URL.helicopter,iconSize: [30, 30],iconAnchor: [15, 15],});
const helicopter_img_flip = L.icon({iconUrl: URL.helicopter_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
const ulm_img = L.icon({iconUrl: URL.ulm,iconSize: [30, 30],iconAnchor: [15, 15],});
const ulm_img_flip = L.icon({iconUrl: URL.ulm_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
const military_img = L.icon({iconUrl: URL.military,iconSize: [30, 30],iconAnchor: [15, 15],});
const military_img_flip = L.icon({iconUrl: URL.military_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
const samu_img = L.icon({iconUrl: URL.samu,iconSize: [30, 30],iconAnchor: [15, 15],});
const samu_img_flip = L.icon({iconUrl: URL.samu_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
const ground_vehicle_img = L.icon({iconUrl: URL.ground_vehicle,iconSize: [30, 30],iconAnchor: [15, 15],});
const ground_vehicle_img_flip = L.icon({iconUrl: URL.ground_vehicle_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
const drone_img = L.icon({iconUrl: URL.drone,iconSize: [30, 30],iconAnchor: [15, 15],});
const drone_img_flip = L.icon({iconUrl: URL.drone_flip,iconSize: [30, 30],iconAnchor: [15, 15],});


const icon_map = {
    [AircraftType.CARGO]: cargo_img,
    [AircraftType.PLANE]: plane_img,
    [AircraftType.JET]: jet_img,
    [AircraftType.TURBOPROP]: turboprop_img,
    [AircraftType.MEDIUM]: medium_img,
    [AircraftType.LIGHT]: light_img,
    [AircraftType.SUPER_LIGHT]: super_light_img,
    [AircraftType.GLIDER]: glider_img,
    [AircraftType.HELICOPTER]: helicopter_img,
    [AircraftType.ULM]: ulm_img,
    [AircraftType.MILITARY]: military_img,
    [AircraftType.SAMU]: samu_img,
    [AircraftType.GROUND_VEHICLE]: ground_vehicle_img,
    [AircraftType.DRONE]: drone_img,
    [AircraftType.UNKNOWN]: unknown_img,
}

const flip_icon_map = {
    [AircraftType.CARGO]: cargo_img_flip,
    [AircraftType.PLANE]: plane_img_flip,
    [AircraftType.JET]: jet_img_flip,
    [AircraftType.TURBOPROP]: turboprop_img_flip,
    [AircraftType.MEDIUM]: medium_img_flip,
    [AircraftType.LIGHT]: light_img_flip,
    [AircraftType.SUPER_LIGHT]: super_light_img_flip,
    [AircraftType.GLIDER]: glider_img_flip,
    [AircraftType.HELICOPTER]: helicopter_img_flip,
    [AircraftType.ULM]: ulm_img_flip,
    [AircraftType.MILITARY]: military_img_flip,
    [AircraftType.SAMU]: samu_img_flip,
    [AircraftType.GROUND_VEHICLE]: ground_vehicle_img_flip,
    [AircraftType.DRONE]: drone_img_flip,
    [AircraftType.UNKNOWN]: unknown_img_flip,
}




export class FlightMap {

    private map: L.Map;

    private database:FlightDB;
    private flightAttack:FlightAttack;

    private polylines: Map<number, MultiColorPolyLine> = new Map();
    private markers: Map<number, L.Marker> = new Map();

    private highlighted_flight: number = -1;

    private on_click_callbacks: Array<(e: L.LeafletMouseEvent) => void> = [];

    constructor() {
        this.map = L.map('map', {
            center: [0, 0],
            zoom: 2,
            keyboard: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        this.map.on('click', (e) => {
            for (let callback of this.on_click_callbacks) {
                callback(e);
            }
            this.clearHighlightFlight();

            // if (this.flightAttack.get_selected_attack() != AttackType.REPLAY){
            //     this.flightAttack.select_attack(AttackType.NONE);
            // }
        });

    }

    public addOnClickListener(callback: (e: L.LeafletMouseEvent) => void) : void{
        this.on_click_callbacks.push(callback);
    }



    public setFlightDB(db:FlightDB) : void{
        this.database = db;
    }
    public setFlightAttack(fa:FlightAttack) : void{
        this.flightAttack = fa;
    }

    public fitBounds(box:L.LatLngBounds)
    {
        if (box == undefined) return;
        this.map.fitBounds(box);
    }

    public highlightFlight(flight:Flight){
        this.clearHighlightFlight();

        this.highlighted_flight = flight.getHash();

        // update display
        let tag_hashes = flight.getTagsHashes();
        for (let tag_hash of tag_hashes) {
            let trajectory_hash = flight.getHash() + tag_hash;
            if (this.markers.has(trajectory_hash)){
                this.markers.get(trajectory_hash).getElement().classList.add('highlight');
            }
        }
    }

    public clearHighlightFlight(){
        if (this.highlighted_flight == -1) return;
        // update display

        let flight = this.database.findFlight(this.highlighted_flight);
        let tag_hashes = flight.getTagsHashes();

        for (let tag_hash of tag_hashes) {
            let trajectory_hash = flight.getHash() + tag_hash;
            if (this.markers.has(trajectory_hash)){
                this.markers.get(trajectory_hash).getElement().classList.remove('highlight');
            }
        }
        // clear
        this.highlighted_flight = -1
    }

    public getHighlightedFlight() : number{ return this.highlighted_flight; }

    public update(minTimestamp:number, maxTimestamp:number) : number // return the number of aircrafts
    {

        const BASE_COLOR = "#184296";
        const VALID_COLOR = "#44bd32";
        const ANOMALY_COLOR = "#e84118";

        let data:MapMessage[] = []

        let show_range: boolean = false;
        if (minTimestamp == maxTimestamp){
            data = this.database.getMapData(minTimestamp);
        }
        else{
            data = this.database.getMapData(minTimestamp, maxTimestamp);
            show_range = true;
        }

        let opacity = 1;

        let visible_flight = new Map<number, boolean>();
        for (let key of this.polylines.keys()) {
            visible_flight.set(key, false);
        }

        for (const traj of data) {
            let trajectory_hash = traj.flight_hash + traj.tag_hash;
            // let color = traj.anomaly == undefined ? BASE_COLOR : traj.anomaly ? ANOMALY_COLOR : VALID_COLOR;
            // let display_opt = {
            //     color: color,

            // }

            let display_opt = {
                color: new Array(traj.coords.length).fill(BASE_COLOR),
                weight: new Array(traj.coords.length).fill(2),
            }

            for (let i = 0; i < traj.anomaly.length; i++) {
                if (traj.anomaly[i] != undefined){
                    if (traj.anomaly[i]) display_opt.color[i] = ANOMALY_COLOR;
                    else display_opt.color[i] = VALID_COLOR;
                }
            }


            visible_flight.set(trajectory_hash, true);
            if (!this.polylines.has(trajectory_hash)){
                let poly = new MultiColorPolyLine(traj.coords, display_opt, opacity).addTo(this.map);
                this.polylines.set(trajectory_hash, poly);

                let last = traj.coords[traj.coords.length-1];
                let angle = traj.rotation + 90;

                let marker: L.Marker;
                if (angle < 90 || angle > 270){
                    marker = new L.Marker(
                        {lat:last[0], lng:last[1]},
                        {icon: icon_map[traj.type],
                            rotationAngle:angle}).addTo(this.map);
                }
                else
                {
                    marker = new L.Marker(
                        {lat:last[0], lng:last[1]},
                        {icon: flip_icon_map[traj.type],
                            rotationAngle:angle + 180}).addTo(this.map);
                }
                marker.on('click', (e) => {
                    this.database.watchFlight(traj.flight_hash);
                    this.flightAttack.flight_clicked(traj.flight_hash);
                });

                this.markers.set(trajectory_hash, marker);
                if (this.highlighted_flight == traj.flight_hash){
                    marker.getElement().classList.add('highlight');
                }
            }
            else
            {
                this.polylines.get(trajectory_hash).setLatLngs(traj.coords, display_opt);
                this.polylines.get(trajectory_hash).setStyle({opacity: opacity});


                let last = traj.coords[traj.coords.length-1];

                let angle = traj.rotation + 90;
                let marker = this.markers.get(trajectory_hash);
                marker.setLatLng({lat: last[0], lng: last[1]});
                if (angle < 90 || angle > 270){
                    if (marker.options.icon != icon_map[traj.type])
                        marker.setIcon(icon_map[traj.type]);
                    marker.setRotationAngle(angle);
                }
                else{
                    if (marker.options.icon != flip_icon_map[traj.type])
                        marker.setIcon(flip_icon_map[traj.type]);
                    marker.setRotationAngle(angle + 180);
                }
                if (this.highlighted_flight == traj.flight_hash){
                    marker.getElement().classList.add('highlight');
                }
            }
        }

        // hide unused polylines
        for (let [key, visible] of visible_flight.entries()) {
            if (!visible){
                this.polylines.get(key).removeLayer();
                this.map.removeLayer(this.markers.get(key));

                this.polylines.delete(key);
                this.markers.delete(key);
            }

        }

        // if show range hide all markers
        if (show_range){
            for (let marker of this.markers.values()) {
                marker.setOpacity(0);
            }
        }
        else{
            for (let marker of this.markers.values()) {
                marker.setOpacity(1);
            }
        }


        return data.length;

    }

    public elementXYToLatLng(x:number, y:number) : L.LatLng
    {
        return this.map.containerPointToLatLng(L.point(x, y));
    }


}