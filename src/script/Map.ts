
import * as L from 'leaflet';
import "leaflet-rotatedmarker";
import "leaflet/dist/leaflet.css";

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



var helico_img = L.icon({
    iconUrl: URL.helico,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});
var helico_img_flip = L.icon({
    iconUrl: URL.helico_flip,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});
var plane_img = L.icon({
    iconUrl: URL.plane,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});
var plane_img_flip = L.icon({
    iconUrl: URL.plane_flip,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});
var glider_img = L.icon({
    iconUrl: URL.glider,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});
var glider_img_flip = L.icon({
    iconUrl: URL.glider_flip,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});
var medium_plane_img = L.icon({
    iconUrl: URL.medium_plane,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});
var medium_plane_img_flip = L.icon({
    iconUrl: URL.medium_plane_flip,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});
var lightplane_img = L.icon({
    iconUrl: URL.lightplane,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});
var lightplane_img_flip = L.icon({
    iconUrl: URL.lightplane_flip,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});
var ultra_lightplane_img = L.icon({
    iconUrl: URL.ultra_lightplane,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});
var ultra_lightplane_img_flip = L.icon({
    iconUrl: URL.ultra_lightplane_flip,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});

var goundvehicle_img = L.icon({
    iconUrl: URL.goundvehicle,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});
var goundvehicle_img_flip = L.icon({
    iconUrl: URL.goundvehicle_flip,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});
var military_img = L.icon({
    iconUrl: URL.military,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});
var military_img_flip = L.icon({
    iconUrl: URL.military_flip,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});
var unknown_img = L.icon({
    iconUrl: URL.unknown,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});
var unknown_img_flip = L.icon({
    iconUrl: URL.unknown_flip,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});


var icon_map = {
    [AircraftType.HELICOPTER]: helico_img,
    [AircraftType.PLANE]: plane_img,
    [AircraftType.GLIDER]: glider_img,
    [AircraftType.MEDIUM_PLANE]: medium_plane_img,
    [AircraftType.LIGHT_PLANE]: lightplane_img,
    [AircraftType.ULTRA_LIGHT_PLANE]: ultra_lightplane_img,
    [AircraftType.GROUND_VEHICLE]: goundvehicle_img,
    [AircraftType.MILITARY]: military_img,
    [AircraftType.UNKNOWN]: unknown_img,
}

var flip_icon_map = {
    [AircraftType.HELICOPTER]: helico_img_flip,
    [AircraftType.PLANE]: plane_img_flip,
    [AircraftType.GLIDER]: glider_img_flip,
    [AircraftType.MEDIUM_PLANE]: medium_plane_img_flip,
    [AircraftType.LIGHT_PLANE]: lightplane_img_flip,
    [AircraftType.ULTRA_LIGHT_PLANE]: ultra_lightplane_img_flip,
    [AircraftType.GROUND_VEHICLE]: goundvehicle_img_flip,
    [AircraftType.MILITARY]: military_img_flip, 
    [AircraftType.UNKNOWN]: unknown_img_flip,
}




export class Map {

    private map: L.Map;
    private database:FlightDB;


    private polylines: Array<L.Polyline> = Array();
    private markers: Array<L.Marker> = Array();

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
                callsign: string;
                icao24: string;
                coords: [number, number][];
                rotation:number;
                start_time: number;
                end_time: number;
                flight: Flight;
            }> = []
            
        var show_range: boolean = false;
        if (minTimestamp == maxTimestamp){
            data = this.database.getMapData(minTimestamp);
        }
        else{
            data = this.database.getMapData(minTimestamp, maxTimestamp);
            show_range = true;
        }

        var lineWeight = 2;
        var color = '#184296';
        var opacity = 1;

        if (show_range){lineWeight = 1; opacity=0.5 }
        
        for (let i = 0; i < data.length; i++) {

            if (i >= this.polylines.length){
                var poly = L.polyline(data[i].coords, {color: color, weight: lineWeight, opacity: opacity}).addTo(this.map);
                this.polylines.push(poly);

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

                this.markers.push(marker);
                
            }
            else
            {
                this.polylines[i].setLatLngs(data[i].coords);
                this.polylines[i].setStyle({color: color, weight: lineWeight, opacity: opacity});


                var last = data[i].coords[data[i].coords.length-1];
                
                var angle = data[i].rotation + 90;
                this.markers[i].setLatLng({lat: last[0], lng: last[1]});
                
                if (angle < 90 || angle > 270){
                    if (this.markers[i].options.icon != icon_map[data[i].type])
                        this.markers[i].setIcon(icon_map[data[i].type]);
                    this.markers[i].setRotationAngle(angle);
                }
                else{
                    if (this.markers[i].options.icon != flip_icon_map[data[i].type])
                        this.markers[i].setIcon(flip_icon_map[data[i].type]);
                    this.markers[i].setRotationAngle(angle + 180);
                }

                this.markers[i].off()
                this.markers[i].on('click', (e) => {
                    this.database.watchFlight(data[i].flight)
                });
            }
        }

        for (let i = data.length; i < this.polylines.length; i++) {
            this.map.removeLayer(this.polylines[i]);
            this.map.removeLayer(this.markers[i]);
        }
        var nb_to_remove = this.polylines.length - data.length;

        if (nb_to_remove > 0){
            this.polylines.splice(data.length, nb_to_remove);
            this.markers.splice(data.length, nb_to_remove);
        }

        // if show range hide all markers
        if (show_range){
            for (let i = 0; i < this.markers.length; i++) {
                this.markers[i].setOpacity(0);
            }
        }
        else{
            for (let i = 0; i < this.markers.length; i++) {
                this.markers[i].setOpacity(1);
            }
        }

        return data.length;

    }
}