
import { init_MultiADSBMessage, MultiADSBMessage } from "../Types";
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

    let date = new Date(value);
    return date.getTime() / 1000.0;
}
export function loadACSV(content:string[][], header:string[], filename:string = ""):MultiADSBMessage {


    if (content.length == 0){
        console.log("empty file : ", filename);
        return;
    }

    // create an array of content.length ADSBMessage
    let res:MultiADSBMessage = init_MultiADSBMessage(content.length);


    // loop through the header and assign the data to the correct array
    for (let c = 0; c < header.length; c++) {
        let column = header[c];
        if (column == "time" || column=="timestamp" || column == "7_8"){
            for (let i = 0; i < content.length; i++) {
                if (content[i][c] == undefined){
                    console.log("undefined content for file : ", filename);
                }
                res.timestamp[i] = auto_date_parse(content[i][c]);
            }
        }
        else if(column == "icao24"){
            res.icao24 = content[0][c];
        }
        else if(column == "4"){
            res.icao24 = U.num_to_hex(parseInt(content[0][c]));
        }
        else if(column == "lat" || column == "15" || column == "latitude"){
            for (let i = 0; i < content.length; i++) {
                res.latitude[i] = parseFloat(content[i][c]);
            }
        }
        else  if(column == "lon" || column == "16" || column == "longitude"){
            for (let i = 0; i < content.length; i++) {
                res.longitude[i] = parseFloat(content[i][c]);
            }
        }
        else if (column == "velocity" || column == "13"  || column == "groundspeed"){
            for (let i = 0; i < content.length; i++) {
                res.groundspeed[i] = parseFloat(content[i][c]);
            }
        }
        else if (column == "heading" || column == "14"|| column == "track"){
            for (let i = 0; i < content.length; i++) {
                res.track[i] = parseFloat(content[i][c]);
            }
        }
        else if (column == "vertrate" || column == "17" || column == "vertical_rate"){
            for (let i = 0; i < content.length; i++) {
                res.vertical_rate[i] = parseFloat(content[i][c]);
            }
        }
        else if (column == "callsign"){
            for (let i = 0; i < content.length; i++) {
                if (content[i][c] == undefined || content[i][c] == ""){
                    res.callsign[i] = "NULL";
                }
                else{
                    res.callsign[i] = content[i][c];
                }
            }
        }
        else if (column == "onground"){
            for (let i = 0; i < content.length; i++) {
                // convert to boolean
                res.onground[i] = (content[i][c] == "true" || content[i][c] == "True")
            }
        }
        else if (column == "alert"){
            for (let i = 0; i < content.length; i++) {
                // convert to boolean
                res.alert[i] = (content[i][c] == "true" || content[i][c] == "True")
            }
        }
        else if (column == "spi"){
            for (let i = 0; i < content.length; i++) {
                // convert to boolean
                res.spi[i] = (content[i][c] == "true" || content[i][c] == "True")
            }
        }
        else if (column == "squawk"){
            for (let i = 0; i < content.length; i++) {
                res.squawk[i] = parseInt(content[i][c]);
            }
        }
        else if (column == "baroaltitude" || column == "12" || column == "altitude"){
            for (let i = 0; i < content.length; i++) {
                res.altitude[i] = parseFloat(content[i][c]);
            }
        }
        else if (column == "geoaltitude"  || column == "12"){
            for (let i = 0; i < content.length; i++) {
                res.geoaltitude[i] = parseFloat(content[i][c]);
            }
        }
        else if (column == "anomaly"){
            res.anomaly = Array(content.length).fill(false);
            for (let i = 0; i < content.length; i++) {
                // convert to boolean
                res.anomaly[i] = (content[i][c] == "true" || content[i][c] == "True")
            }
        }
    }


    // check required columns
    if (res.icao24 == ""){
        return undefined;
    }


    if (res.timestamp[0] < 30 * 24 * 60 * 60)
    {
        // shift time to today
        let today = new Date();
        let today_start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() / 1000;
        let shift = today_start - res.timestamp[0];
        for (let i = 0; i < content.length; i++) {
            res.timestamp[i] += shift;
        }
    }
    return res;
}


function split_content_on_icao(content:string[][], header:string[]): string[][][]{
    let icao_coli = header.indexOf("icao24");

    if (icao_coli == -1){
        console.log("no icao24 column found");

        return [content];
    }

    let icao_split:string[][][] = [];
    let icao_index = {};

    for (let i = 0; i < content.length; i++) {
        let icao = content[i][icao_coli];

        if (icao_index[icao] == undefined){
            icao_index[icao] = icao_split.length;
            icao_split.push([]);
        }

        icao_split[icao_index[icao]].push(content[i]);
    }
    return icao_split;
}



export function loadFromCSV(filename:string, file_content:string) : MultiADSBMessage[]
{
    // split the file content into lines
    file_content = file_content.trim();
    let lines = file_content.split('\n');

    // first line is the header
    let header = lines[0].split(',');

    let content:string[][] = [];
    for (let i = 1; i < lines.length; i++) {
        let line:string[] = lines[i].split(',');
        content.push(line);
    }

    let contents = split_content_on_icao(content, header);

    let res:MultiADSBMessage[] = [];

    for (let i = 0; i < contents.length; i++) {
        let c = loadACSV(contents[i], header, filename);
        if (c != undefined){
            res.push(c);
        }
    }
    console.log(res);
    
    return res
}