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
export function loadACSV(content:string[][], header:string[], filename:string = ""){
    var time:Array<number> = Array();
    var icao24:string =  "";
    var lat:Array<number> =  Array();
    var lon:Array<number> =  Array();
    var velocity:Array<number> =  Array();
    var heading:Array<number> =  Array();
    var vertical_rate:Array<number> =  Array();
    var callsign:string[] =  Array();
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
    var anomaly:Array<boolean> =  Array();
    var probabilities:Array<number>[] = [];

    if (content.length == 0){
        console.log("empty file : ", filename);
        return;
    }
        

    // loop through the header and assign the data to the correct array
    for (var c = 0; c < header.length; c++) {
        var column = header[c];
        if (column == "time" || column=="timestamp" || column == "7_8"){
            for (var i = 0; i < content.length; i++) {
                if (content[i][c] == undefined){
                    console.log("undefined content for file : ", filename);
                }
                    
                time.push(auto_date_parse(content[i][c]));
            }
        }
        else if(column == "icao24"){
            icao24 = content[0][c];
        }
        else if(column == "4"){
            icao24 = U.num_to_hex(parseInt(content[0][c]));
        }
        else if(column == "lat" || column == "15" || column == "latitude"){
            for (var i = 0; i < content.length; i++) {
                lat.push(parseFloat(content[i][c]));
            }
        }
        else  if(column == "lon" || column == "16" || column == "longitude"){
            for (var i = 0; i < content.length; i++) {
                lon.push(parseFloat(content[i][c]));
            }
        }
        else if (column == "velocity" || column == "13"  || column == "groundspeed"){
            for (var i = 0; i < content.length; i++) {
                velocity.push(parseFloat(content[i][c]));
            }
        }
        else if (column == "heading" || column == "14"|| column == "track"){
            for (var i = 0; i < content.length; i++) {
                heading.push(parseFloat(content[i][c]));
            }
        }
        else if (column == "vertrate" || column == "17" || column == "vertical_rate"){
            for (var i = 0; i < content.length; i++) {
                vertical_rate.push(parseFloat(content[i][c]));
            }
        }
        else if (column == "callsign"){
            for (var i = 0; i < content.length; i++) {
                if (content[i][c] == undefined || content[i][c] == ""){
                    callsign.push("NULL");
                }
                else{
                    callsign.push(content[i][c]);
                }
            }
        }
        else if (column == "onground"){
            for (var i = 0; i < content.length; i++) {
                // convert to boolean
                if (content[i][c] == "true" || content[i][c] == "True"){
                    on_ground.push(true);
                }
                else{
                    on_ground.push(false);
                }
                
            }
        }
        else if (column == "alert"){
            for (var i = 0; i < content.length; i++) {
                // convert to boolean
                if (content[i][c] == "true" || content[i][c] == "True"){
                    alert.push(true);
                }
                else{
                    alert.push(false);
                }
            }
        }
        else if (column == "spi"){
            for (var i = 0; i < content.length; i++) {
                // convert to boolean
                if (content[i][c] == "true" || content[i][c] == "True"){
                    spi.push(true);
                }
                else{
                    spi.push(false);
                }
            }
        }
        else if (column == "squawk"){
            for (var i = 0; i < content.length; i++) {
                squawk.push(parseInt(content[i][c]));
            }
        }
        else if (column == "baroaltitude" || column == "12" || column == "altitude"){
            for (var i = 0; i < content.length; i++) {
                baro_altitude.push(parseFloat(content[i][c]));
            }
        }
        else if (column == "geoaltitude"  || column == "12"){
            for (var i = 0; i < content.length; i++) {
                geo_altitude.push(parseFloat(content[i][c]));
            }
        }
        // else if (column == "lastposupdate" || column == "last_position"){
        //     for (var i = 0; i < content.length; i++) {
        //         last_pos_update.push(auto_date_parse(content[i][c]));
        //     }
        // }
        // else if (column == "lastcontact"){
        //     for (var i = 0; i < content.length; i++) {
        //         last_contact.push(auto_date_parse(content[i][c]));

        //     }
        // }
        // else if (column == "hour"){
        //     for (var i = 0; i < content.length; i++) {
        //         hour.push(auto_date_parse(content[i][c]));
        //     }
        // }
        else if (column == "interpolated"){
            for (var i = 0; i < content.length; i++) {
                // convert to boolean
                if (content[i][c] == "true" || content[i][c] == "True"){
                    interpolated.push(true);
                }
                else{
                    interpolated.push(false);
                }
            }
        }
        else if (column == "prediction" || column == "predicted" || column == "anomaly"){
            for (var i = 0; i < content.length; i++) {
                content[i][c] = content[i][c].toLowerCase();
                // convert to boolean
                if (content[i][c] == "true"){
                    anomaly.push(true);
                }
                else if (content[i][c] == "" || content[i][c] == "none" || content[i][c] == "nan" || content[i][c] == "undefined"){
                    anomaly.push(undefined);
                }
                else{
                    anomaly.push(false);
                }
            }

            if (column != "anomaly"){
                // invert anomaly
                for (var i = 0; i < anomaly.length; i++) {
                    anomaly[i] = !anomaly[i];
                }
            }
        }
        else if (column == "y_"){
            for (var i = 0; i < content.length; i++) {
                let prob = content[i][c];
                let probs = prob.split(";");
                let probs_f = probs.map((x) => {return parseFloat(x);});
                probabilities.push(probs_f);
            }
        }
    }


    // check required columns
    if (icao24 == ""){
        return undefined;
    }
    if (lat.length == 0 || lon.length == 0){
        return undefined;
    }
    if (time.length == 0){
        return undefined;
    }
    if (baro_altitude.length == 0 && geo_altitude.length == 0){
        return undefined;
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



    return {
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
        interpolated : interpolated,
        anomaly : anomaly,
        probabilities : probabilities
    };
}


function split_content_on_icao(content:string[][], header:string[]): string[][][]{
    var icao_coli = header.indexOf("icao24");

    if (icao_coli == -1){
        console.log("no icao24 column found");
        
        return [content];
    }

    var icao_split:string[][][] = [];
    var icao_index = {};

    for (var i = 0; i < content.length; i++) {
        var icao = content[i][icao_coli];

        if (icao_index[icao] == undefined){
            icao_index[icao] = icao_split.length;
            icao_split.push([]);
        }

        icao_split[icao_index[icao]].push(content[i]);
    }
    return icao_split;
}



export function loadFromCSV(filename:string, file_content:string)
{
    // split the file content into lines
    file_content = file_content.trim();
    var lines = file_content.split('\n');

    // first line is the header
    var header = lines[0].split(',');

    var content:string[][] = [];
    for (var i = 1; i < lines.length; i++) {
        var line:string[] = lines[i].split(',');
        content.push(line);
    }

    var contents = split_content_on_icao(content, header);

    var res:{
        time: number[], icao24: string,lat: number[],lon: number[],
        velocity: number[],heading: number[],vertical_rate: number[],
        callsign: string[],on_ground: boolean[],alert: boolean[],spi: boolean[],
        squawk: number[],baro_altitude: number[],geo_altitude: number[],
        last_pos_update: number[],last_contact: number[],hour: number[],
        start_time: number,end_time: number,interpolated: boolean[],
        anomaly: boolean[], probabilities: number[][]}[] = [];

    for (var i = 0; i < contents.length; i++) {
        var c = loadACSV(contents[i], header, filename);
        if (c != undefined){
            res.push(c);
        }
    }
    return res
}