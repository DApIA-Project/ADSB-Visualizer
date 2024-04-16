
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


var unknown_img = L.icon({iconUrl: URL.unknown,iconSize: [30, 30],iconAnchor: [15, 15],});
var unknown_img_flip = L.icon({iconUrl: URL.unknown_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
var cargo_img = L.icon({iconUrl: URL.cargo,iconSize: [30, 30],iconAnchor: [15, 15],});
var cargo_img_flip = L.icon({iconUrl: URL.cargo_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
var plane_img = L.icon({iconUrl: URL.plane,iconSize: [30, 30],iconAnchor: [15, 15],});
var plane_img_flip = L.icon({iconUrl: URL.plane_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
var jet_img = L.icon({iconUrl: URL.jet,iconSize: [30, 30],iconAnchor: [15, 15],});
var jet_img_flip = L.icon({iconUrl: URL.jet_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
var turboprop_img = L.icon({iconUrl: URL.turboprop,iconSize: [30, 30],iconAnchor: [15, 15],});
var turboprop_img_flip = L.icon({iconUrl: URL.turboprop_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
var medium_img = L.icon({iconUrl: URL.medium,iconSize: [30, 30],iconAnchor: [15, 15],});
var medium_img_flip = L.icon({iconUrl: URL.medium_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
var light_img = L.icon({iconUrl: URL.light,iconSize: [30, 30],iconAnchor: [15, 15],});
var light_img_flip = L.icon({iconUrl: URL.light_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
var super_light_img = L.icon({iconUrl: URL.super_light,iconSize: [30, 30],iconAnchor: [15, 15],});
var super_light_img_flip = L.icon({iconUrl: URL.super_light_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
var glider_img = L.icon({iconUrl: URL.glider,iconSize: [30, 30],iconAnchor: [15, 15],});
var glider_img_flip = L.icon({iconUrl: URL.glider_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
var helicopter_img = L.icon({iconUrl: URL.helicopter,iconSize: [30, 30],iconAnchor: [15, 15],});
var helicopter_img_flip = L.icon({iconUrl: URL.helicopter_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
var ulm_img = L.icon({iconUrl: URL.ulm,iconSize: [30, 30],iconAnchor: [15, 15],});
var ulm_img_flip = L.icon({iconUrl: URL.ulm_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
var military_img = L.icon({iconUrl: URL.military,iconSize: [30, 30],iconAnchor: [15, 15],});
var military_img_flip = L.icon({iconUrl: URL.military_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
var samu_img = L.icon({iconUrl: URL.samu,iconSize: [30, 30],iconAnchor: [15, 15],});
var samu_img_flip = L.icon({iconUrl: URL.samu_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
var ground_vehicle_img = L.icon({iconUrl: URL.ground_vehicle,iconSize: [30, 30],iconAnchor: [15, 15],});
var ground_vehicle_img_flip = L.icon({iconUrl: URL.ground_vehicle_flip,iconSize: [30, 30],iconAnchor: [15, 15],});
var drone_img = L.icon({iconUrl: URL.drone,iconSize: [30, 30],iconAnchor: [15, 15],});
var drone_img_flip = L.icon({iconUrl: URL.drone_flip,iconSize: [30, 30],iconAnchor: [15, 15],});


var icon_map = {
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

var flip_icon_map = {
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


    private polylines: Map<number, MultiColorPolyLine> = new Map();
    private markers: Map<number, L.Marker> = new Map();

    constructor() {
        this.map = L.map('map', {
            center: [0, 0],
            zoom: 2,
            keyboard: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
        }).addTo(this.map);

    }

    public setFlightDB(db:FlightDB) : void{
        this.database = db;
    }

    public fitBounds(box:L.LatLngBounds)
    {
        if (box == undefined) return;
        this.map.fitBounds(box);
    }

    public update(minTimestamp:number, maxTimestamp:number) : number // return the number of aircrafts
    {
        var data:
            Array<{
                type: AircraftType;
                icao24: string;
                coords: [number, number][];
                rotation:number;
                start_time: number;
                end_time: number;
                flight: Flight;
                display_opt: {[key:string]:any[]};
            }> = []
            
        var show_range: boolean = false;
        if (minTimestamp == maxTimestamp){
            data = this.database.getMapData(minTimestamp);
        }
        else{
            data = this.database.getMapData(minTimestamp, maxTimestamp);
            show_range = true;
        }
        

        var opacity = 1;


        var shown_flight = new Map<number, boolean>();
        for (let key of this.polylines.keys()) {
            shown_flight.set(key, false);
        }
        
        for (let i = 0; i < data.length; i++) {
            var flight_id = data[i].flight.getHash();
            
            shown_flight.set(flight_id, true);
            if (!this.polylines.has(flight_id)){
                var poly = new MultiColorPolyLine(data[i].coords, data[i].display_opt, opacity).addTo(this.map);
                this.polylines.set(flight_id, poly);

                var last = data[i].coords[data[i].coords.length-1];
                var angle = data[i].rotation + 90;

                var marker: L.Marker;
                if (angle < 90 || angle > 270){
                    marker = new L.Marker(
                        {lat:last[0], lng:last[1]}, 
                        {icon: icon_map[data[i].type], 
                            rotationAngle:angle}).addTo(this.map);
                }
                else
                {
                    marker = new L.Marker(
                        {lat:last[0], lng:last[1]}, 
                        {icon: flip_icon_map[data[i].type], 
                            rotationAngle:angle + 180}).addTo(this.map);
                }
                marker.on('click', (e) => {
                    this.database.watchFlight(data[i].flight)
                });

                this.markers.set(flight_id, marker);
            }
            else
            {
                this.polylines.get(flight_id).setLatLngs(data[i].coords, data[i].display_opt);
                this.polylines.get(flight_id).setStyle({opacity: opacity});


                var last = data[i].coords[data[i].coords.length-1];
                
                var angle = data[i].rotation + 90;
                var marker = this.markers.get(flight_id);
                marker.setLatLng({lat: last[0], lng: last[1]});
                if (angle < 90 || angle > 270){
                    if (marker.options.icon != icon_map[data[i].type])
                        marker.setIcon(icon_map[data[i].type]);
                    marker.setRotationAngle(angle);
                }
                else{
                    if (marker.options.icon != flip_icon_map[data[i].type])
                        marker.setIcon(flip_icon_map[data[i].type]);
                    marker.setRotationAngle(angle + 180);
                }
            }
        }

        // hide unused polylines
        for (let [key, value] of shown_flight.entries()) {
            if (!value){
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
}