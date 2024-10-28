import { FlightMap } from "./FlightMap";



export class Debugger {

    private is_active:boolean = false;
    private is_open:boolean = false;
    private map: FlightMap;

    constructor() {
    }

    public setMap(map: FlightMap) {
        this.map = map;
    }


    public active(){
        this.is_active = true;
        this.map.debug_mode_changed();
    }

    public desactive(){
        this.is_active = false;
        this.is_open = false;
        this.map.debug_mode_changed();
    }

    public isActived(){
        return this.is_active;
    }
}