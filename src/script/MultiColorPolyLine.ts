
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