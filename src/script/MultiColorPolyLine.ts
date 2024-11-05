// @ts-nocheck

import * as PIXI from 'pixi.js';
import 'leaflet-pixi-overlay';
import * as L from 'leaflet';


export class MultiColorPolyLine{

    subLines: L.Polyline[] = [];
    map: L.Map;

    constructor(coordinates:[number, number][], opt:{[key:string]:any[]}, opacity: number){

        this.setLatLngs(coordinates, opt);
        this.setStyle({opacity: opacity});
        this.map = undefined;
    }

    addTo(map: L.Map){
        this.map = map;
        for (let i = 0; i < this.subLines.length; i++) {
            this.subLines[i].addTo(map);
        }
        return this;
    }

    setLatLngs(coordinates:[number, number][], opt:{[key:string]:any[]}){
        var sections: [number, number][][] = [];
        var sections_opt: {[key:string]:any}[] = [];
        var acutalSection: [number, number][] = [];


        for (let i = 0; i < coordinates.length - 1; i++) {
            acutalSection.push(coordinates[i]);

            var change = false;
            for (let key in opt){
                if (opt[key][i] != opt[key][i+1]){
                    change = true;
                    break;
                }
            }

            if (change){
                sections.push(acutalSection);

                var opt_ = {};
                for (let key in opt){
                    opt_[key] = opt[key][i];
                }
                sections_opt.push(opt_);

                acutalSection = [acutalSection[acutalSection.length - 1]];
            }
        }

        acutalSection.push(coordinates[coordinates.length - 1]);
        sections.push(acutalSection);

        var opt_ = {};
        for (let key in opt){
            opt_[key] = opt[key][coordinates.length - 1];
        }
        sections_opt.push(opt_);



        for (let i = 0; i < sections.length; i++) {
            if (i >= this.subLines.length){
                this.subLines.push(L.polyline(sections[i], sections_opt[i]));

                if (this.map != undefined){
                    this.subLines[i].addTo(this.map);
                }

            }
            else{
                // ck if they are the same
                var same = true;
                var latlngs:any = this.subLines[i].getLatLngs();

                if (latlngs.length != sections[i].length){
                    same = false;
                } else if (latlngs.length != 0
                    && (latlngs[0].lat != sections[i][0][0] || latlngs[0].lng != sections[i][0][1])){
                    same = false;
                } // check if opt are the same
                else{
                    var same_style = true;
                    for (let key in sections_opt[i]){
                        if (sections_opt[i][key] != this.subLines[i].options[key]){
                            same_style = false;
                            break;
                        }
                    }

                    if (!same_style){
                        this.subLines[i].setStyle(sections_opt[i]);
                    }
                }
                if (!same){
                    this.subLines[i].setLatLngs(sections[i]).setStyle(sections_opt[i]);
                }
            }
        }

        for (let i = sections.length; i < this.subLines.length; i++) {
            this.map.removeLayer(this.subLines[i]);
        }
        this.subLines.splice(sections.length, this.subLines.length - sections.length);

        return this;
    }

    setStyle(options: L.PathOptions){
        // remove the color option
        delete options.color;

        for (let i = 0; i < this.subLines.length; i++) {
            this.subLines[i].setStyle(options);
        }
        return this;
    }

    removeLayer(){
        for (let i = 0; i < this.subLines.length; i++) {
            this.map.removeLayer(this.subLines[i]);
        }
        return this;
    }
}

const cross_svg=`<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><line stroke-width="2" x1="5" y1="5" x2="15" y2="15" stroke="black" /><line stroke-width="2" x1="5" y1="15" x2="15" y2="5" stroke="black" /></svg>`
const markerTexture = PIXI.Texture.from(cross_svg);

class MarkerInfo{
    latlng: L.LatLng;
    needUpdate: boolean;
    constructor(latlng: L.LatLng){
        this.latlng = latlng;
        this.needUpdate = true;
    }
}

export class CrossCloudLayer{

    private map: L.Map;
    private pixiContainer:PIXI.Container;
    private pixiOverlay:L.pixiOverlay;
    private makers:PIXI.Sprite[] = [];
    private makers_info:MarkerInfo[] = [];
    private available_slots:number[] = [];



    constructor(map: L.Map){
        this.map = map;
        let prevZoom;

        let marker = new PIXI.Sprite(markerTexture);
        marker.anchor.set(0.5, 0.5);
        marker.scale.set(1);

        this.pixiContainer = new PIXI.Container();
        this.pixiOverlay = L.pixiOverlay((utils) => {
            const zoom = utils.getMap().getZoom();
            const container = utils.getContainer();
            const renderer = utils.getRenderer();
            const project = utils.latLngToLayerPoint;
            const scale = utils.getScale();

            for (let i = 0; i < this.makers_info.length; i++) {
                if (!this.makers_info[i].needUpdate) continue;
                if (this.makers_info[i].latlng.lat == undefined) continue;

                let markerCoords = project(this.makers_info[i].latlng);
                this.makers[i].x = markerCoords.x;
                this.makers[i].y = markerCoords.y;
            }


            prevZoom = zoom;
            renderer.render(container);

        }, this.pixiContainer);

        this.pixiOverlay.addTo(this.map);
    }


    public addMarker(latlng: L.LatLng) : number{

        if (latlng.lat == undefined) return -1;
        if (latlng.lat == 0) return -1;
        let index =  -1;
        if (this.available_slots.length > 0){
            index = this.available_slots.pop();
            if (this.makers[index].visible)
                console.log("Error: marker is already visible");
        }
        else{
            index = this.makers.length;
            this.makers.push(new PIXI.Sprite(markerTexture));
            this.makers_info.push(new MarkerInfo(latlng));
            this.pixiContainer.addChild(this.makers[index]);
            this.makers[index].anchor.set(0.5, 0.5);
            this.makers[index].scale.set(0.002);
            // set rotation
            this.makers[index].rotation = Math.random() * Math.PI * 2;
        }
        this.makers[index].visible = (latlng.lat != undefined);
        this.makers_info[index].latlng = latlng;
        this.makers_info[index].needUpdate = true;
        this.pixiOverlay.redraw();

        return index;
    }

    public removeMarker(index:number){
        if (index == undefined) return;
        if (index == -1) return;
        let marker = this.makers[index];
        marker.visible = false;
        this.pixiOverlay.redraw();
        // check if index is in available_slots
        if (this.available_slots.indexOf(index) != -1) {
            console.log("Error: index is already in available_slots");
        }
        this.available_slots.push(index);

    }

    public clear(){
        for (let i = 0; i < this.makers.length; i++) {
            this.makers[i].visible = false;
            this.available_slots.push(i);
        }
        this.pixiOverlay.redraw();
    }

}