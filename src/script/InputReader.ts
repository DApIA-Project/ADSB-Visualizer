// read incoming files
import { Flight } from './Flight';
import {FlightDB} from './FlightDB';
import * as M from './Map';

// manage the drop zone
// - display the drop zone when a file is dragged over the window
// - read the file when dropped and avoid duplicates efficiently
// - ask the database to add the flight
// - manage nice loading screen

var filename_ext = "sbs";
var default_example = require("url:/example/sbs/record_AFR.sbs")


export class InputReader{

    private html_drop_zone: HTMLElement;

    private html_loading_screen: HTMLElement;
    private html_loading_screen_icons: Array<HTMLElement> = Array();
    private html_loading_bar: HTMLElement;

    // count the number of drop start triggered by the various
    // html elements to know when nothing is in the drop zone
    private hover_counter: number = 0;

    private total_files_count: number = 0;
    private files_in_progress: Map<FileReader, File> = new Map();

    private flight_db: FlightDB = undefined;
    private map: M.Map = undefined;

    constructor(){
        this.html_drop_zone = document.getElementById('drop-zone');
        this.html_drop_zone.style.display = 'none';
        this.html_drop_zone.hidden = false;

        this.html_loading_screen = document.getElementById('loading-screen');
        this.html_loading_bar = document.getElementById('loading-bar-progress');
        this.html_loading_screen.style.display = 'none';

        // for each image under html_loading_screen
        var images = this.html_loading_screen.getElementsByTagName('img');
        for (var i = 0; i < images.length; i++){
            this.html_loading_screen_icons.push(images[i]);
        }


        // file reader
        document.getElementById('add-flight-btn').addEventListener('change', (e) => {
            this.onDrop(e);
        });
        document.getElementById('add-flight-btn-in-list').addEventListener('change', (e) => {
            this.onDrop(e);
        });
        

        // drag and drop events
        window.addEventListener('dragover', (e) => {this.onDragOver(e); });
        window.addEventListener('drop', (e) => { this.onDrop(e); });
        window.addEventListener('dragenter', (e) => { this.onDragEnter(e); });
        window.addEventListener('dragleave', (e) => { this.onDragLeave(e); });
        

        
    }


    // link to the flight list
    public setFlightDB(flight_db: FlightDB) : void{
        this.flight_db = flight_db;
    }
    public setMap(map: M.Map) : void{
        this.map = map;
    }
    private ondrop(filename: string, content: string, example_mode=false) : void {
        // do the parsing and add the flights of the file to the database
        this.flight_db.addFlights(filename, content, example_mode);
    }
    ///////////////////////////


    public loadDefaultExample() : void {
        this.openLoadingScreen();
        var filename = 'example.'+filename_ext;
        this.html_loading_bar.style.width = '70%';
        
        fetch(default_example).then(response => response.text()).then(text => {
            var content = text;
            this.ondrop(filename, content, true); // hidden list, example mode
            this.moveBoundingBox()
            this.closeLoadingScreen();
        });
    }



    public isProcessing() : boolean {
        return this.files_in_progress.size > 0;
    }
    public processingProgress() : number {
        return (1 - this.files_in_progress.size / this.total_files_count) * 100;
    }



    public updateLoadingScreen() : void {
        this.html_loading_bar.style.width = this.processingProgress() + '%';
    }





    // event listeners callbacks
    public onDragOver(event) {
        event.preventDefault();
    }
    public onDrop(event) {
        if (event.type == 'drop'){
            event.preventDefault();
        }

        this.hover_counter = 0; // file dropped, nothing is in the drop zone anymore
        this.html_drop_zone.style.display = 'none';

        var files = Array();
        if (event.type == 'drop'){
            files = event.dataTransfer.files;
        }
        else if (event.type == 'change'){
            files = event.target.files;
        }
        
        for (const file of files) {
            if (!this.flight_db.fileExists(file.name)){
                const reader = new FileReader();
                this.files_in_progress.set(reader, file)
                
                reader.addEventListener('load', function (e) {
                    const file = this.files_in_progress.get(e.target);
                    this.ondrop(file.name, e.target.result);
                    this.files_in_progress.delete(e.target)

                    // update avencement bar
                    this.updateLoadingScreen();

                    if (this.files_in_progress.size <= 0){
                        this.total_files_count = 0;
                        this.closeLoadingScreen();
                        this.moveBoundingBox()
                    }
                }.bind(this));

                this.total_files_count++;
                reader.readAsText(file);
            }
        }

        // show loading screen after drop
        if (this.files_in_progress.size > 0)
            this.openLoadingScreen();
        this.updateLoadingScreen();

    }
    public onDragEnter(event) {
        event.preventDefault();
        // a drop event, entered an html element
        // to know when nothing is in the drop zone
        // we have to leave this element again
        this.hover_counter++;
        if (this.hover_counter == 1) {
            this.html_drop_zone.style.display = 'flex';
            // if during loading we drag something else -> hide loading screen to add other files to the queue
            
            this.closeLoadingScreen();
        }
        
    }
    public onDragLeave(event) {
        event.preventDefault();

        this.hover_counter--;
        if (this.hover_counter == 0){
            this.html_drop_zone.style.display = 'none';
            // if after drag leave, there is still files in progress -> show loading screen
            if (this.files_in_progress.size > 0){
                this.openLoadingScreen();
            }
        }
    }



    public moveBoundingBox() : void {
        
        var bounds=this.flight_db.computeBoundingBox();
        this.map.fitBounds(bounds);
    }

    public openLoadingScreen() : void {
        // pick random number for the icon to show
        var icon_index = Math.floor(Math.random() * this.html_loading_screen_icons.length);
        
        this.html_loading_screen_icons[icon_index].hidden = false;

        this.html_loading_screen.style.display = 'flex';
    }
    public closeLoadingScreen() : void {
        // hide all icons
        for (var i = 0; i < this.html_loading_screen_icons.length; i++){
            this.html_loading_screen_icons[i].hidden = true;
        }

        this.html_loading_screen.style.display = 'none';
    }
}

