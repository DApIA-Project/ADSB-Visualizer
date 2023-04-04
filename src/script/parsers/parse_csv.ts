import Flight, { AircraftType } from "../Flight";
import * as U from "../Utils";


function auto_date_parse(value:string){
    
    if (value.match(/^[0-9]+$/))
    {
        return parseInt(value);
    }
    if (value.match(/^[0-9]*\.[0-9]*$/))
    {
        return parseFloat(value);
    }

    var date = new Date(value);
    return date.getTime() / 1000.0;
}


export function loadFromCSV(filename:string, file_content:string)
{

    var time:Array<number> = Array();
    var icao24:string =  "";
    var lat:Array<number> =  Array();
    var lon:Array<number> =  Array();
    var velocity:Array<number> =  Array();
    var heading:Array<number> =  Array();
    var vertical_rate:Array<number> =  Array();
    var callsign:string =  "";
    var on_ground:Array<boolean> =  Array();
    var alert:Array<boolean> =  Array();
    var spi:Array<boolean> =  Array();
    var squawk:Array<number> =  Array();
    var baro_altitude:Array<number> =  Array();
    var geo_altitude:Array<number> =  Array();
    var last_pos_update:Array<number> =  Array();
    var last_contact:Array<number> =  Array();
    var hour:Array<number> =  Array();
    var start_time:number =  0;
    var end_time:number =  0;
    var interpolated:Array<boolean> =  Array();


    // split the file content into lines
    file_content = file_content.trim();
    var lines = file_content.split('\n');

    // first line is the header
    var header = lines[0].split(',');

    var data:string[][] = [];
    for (var i = 1; i < lines.length; i++) {
        var line:string[] = lines[i].split(',');
        data.push(line);
    }

    // loop through the header and assign the data to the correct array
    for (var c = 0; c < header.length; c++) {
        var column = header[c];
        if (column == "time" || column=="timestamp" || column == "7_8"){
            for (var i = 0; i < data.length; i++) {
                time.push(auto_date_parse(data[i][c]));
                
                
            }
            console.log(time);
        }
        if(column == "icao24"){
            icao24 = data[0][c];
        }
        if(column == "4"){
            icao24 = U.num_to_hex(parseInt(data[0][c]));
        }
        if(column == "lat" || column == "15" || column == "latitude"){
            for (var i = 0; i < data.length; i++) {
                lat.push(parseFloat(data[i][c]));
            }
        }
        if(column == "lon" || column == "16" || column == "longitude"){
            for (var i = 0; i < data.length; i++) {
                lon.push(parseFloat(data[i][c]));
            }
        }
        if (column == "velocity" || column == "13"  || column == "groundspeed"){
            for (var i = 0; i < data.length; i++) {
                velocity.push(parseFloat(data[i][c]));
            }
        }
        if (column == "heading" || column == "14"|| column == "track"){
            for (var i = 0; i < data.length; i++) {
                heading.push(parseFloat(data[i][c]));
            }
        }
        if (column == "vertrate" || column == "17" || column == "vertical_rate"){
            for (var i = 0; i < data.length; i++) {
                vertical_rate.push(parseFloat(data[i][c]));
            }
        }
        if (column == "callsign"){
            callsign = data[0][c];
        }
        if (column == "onground"){
            for (var i = 0; i < data.length; i++) {
                // convert to boolean
                if (data[i][c] == "true"){
                    on_ground.push(true);
                }
                else{
                    on_ground.push(false);
                }
                
            }
        }
        if (column == "alert"){
            for (var i = 0; i < data.length; i++) {
                // convert to boolean
                if (data[i][c] == "true"){
                    alert.push(true);
                }
                else{
                    alert.push(false);
                }
            }
        }
        if (column == "spi"){
            for (var i = 0; i < data.length; i++) {
                // convert to boolean
                if (data[i][c] == "true"){
                    spi.push(true);
                }
                else{
                    spi.push(false);
                }
            }
        }
        if (column == "squawk"){
            for (var i = 0; i < data.length; i++) {
                squawk.push(parseInt(data[i][c]));
            }
        }
        if (column == "baroaltitude" || column == "12" || column == "altitude"){
            for (var i = 0; i < data.length; i++) {
                baro_altitude.push(parseFloat(data[i][c]));
            }
        }
        if (column == "geoaltitude"  || column == "12"){
            for (var i = 0; i < data.length; i++) {
                geo_altitude.push(parseFloat(data[i][c]));
            }
        }
        if (column == "lastposupdate" || column == "last_position"){
            for (var i = 0; i < data.length; i++) {
                last_pos_update.push(auto_date_parse(data[i][c]));
            }
        }
        if (column == "lastcontact"){
            for (var i = 0; i < data.length; i++) {
                last_contact.push(auto_date_parse(data[i][c]));

            }
        }
        if (column == "hour"){
            for (var i = 0; i < data.length; i++) {
                hour.push(auto_date_parse(data[i][c]));
            }
        }
        if (column == "interpolated"){
            for (var i = 0; i < data.length; i++) {
                // convert to boolean
                if (data[i][c] == "True"){
                    interpolated.push(true);
                }
                else{
                    interpolated.push(false);
                }
            }
        }
    }


    // check required columns
    if (icao24 == "" && callsign.length == 0){
        return [];
    }
    if (lat.length == 0 || lon.length == 0){
        return [];
    }
    if (time.length == 0){
        return [];
    }
    if (baro_altitude.length == 0 && geo_altitude.length == 0){
        return [];
    }


    if (time[0] < 30 * 24 * 60 * 60)
    {
        // shift time to today
        var today = new Date();
        var today_start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() / 1000;
        var shift = today_start - time[0];
        for (var i = 0; i < time.length; i++) {
            time[i] += shift;
        }
    }

    start_time = time[0];
    end_time = time[time.length - 1];

    if (callsign == ""){
        callsign = "NULL";
    }

    var filename_callsign = filename.split("_");
    
    if (filename_callsign[0] == "callsign"){
        callsign = filename_callsign[1];
    }

    
    

    return [{
        time : time,
        icao24 : icao24,
        lat : lat,
        lon : lon,
        velocity : velocity,
        heading : heading,
        vertical_rate : vertical_rate,
        callsign : callsign,
        on_ground : on_ground,
        alert : alert,
        spi : spi,
        squawk : squawk,
        baro_altitude : baro_altitude,
        geo_altitude : geo_altitude,
        last_pos_update : last_pos_update,
        last_contact : last_contact,
        hour : hour,
        start_time : start_time,
        end_time : end_time,
        interpolated : interpolated
    }];
}