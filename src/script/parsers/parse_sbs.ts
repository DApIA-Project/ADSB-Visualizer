import { MultiADSBMessage } from "../Types";


type SBS_row = {msg: string;icao24: string;time: number;callsign: string;altitude: string;ground_speed: string;track: string;lat: string;lon: string;vertrate: string;squawk: string;alert: string;emergency: string;spi: string;onground: string; interpolated:boolean, anomaly: boolean, probabilities: number[]}



export function loadFromSBS(filename:string, file_content:string):MultiADSBMessage[]
{

    // split the file content into lines
    file_content = file_content.trim();
    let lines = file_content.split('\n');

    let data:SBS_row[] = [];
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim().split(',');

        if (line[0] != "MSG")
            continue;
        line.unshift("");

        let date = new Date(line[7]);
        let time = line[8].split(":");
        let timestamp = 0;
        if (time.length == 3)
            timestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), parseInt(time[0]), parseInt(time[1]), Math.floor(parseFloat(time[2]))).getTime() / 1000;
        else if (time.length == 2)
            timestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, parseInt(time[0]), Math.floor(parseFloat(time[1]))).getTime() / 1000;


        let row:SBS_row = {
            msg:line[1], // message type
            icao24:line[5], // icao24
            time:timestamp, // time
            callsign:line[11], // Callsign
            altitude:line[12], // Altitude
            ground_speed:line[13], // Ground speed
            track:line[14], // Track
            lat:line[15], // Lat
            lon:line[16], // Lon
            vertrate:line[17], // Vertical rate
            squawk:line[18], // Squawk
            alert:line[19], // Alert
            emergency:line[20], // Emergency
            spi:line[21], // SPI
            onground:line[22], // Is on ground
            interpolated:false,
            anomaly:undefined,
            probabilities:undefined
        }

        data.push(row);
    }
    let data_splited = split_on_icao24(data);


    let res:MultiADSBMessage[] = [];

    for (let flight = 0; flight < data_splited.length; flight++) {
        let flight_data = data_splited[flight];
        let flight_attribute = getFlightAttrbutes(flight_data);
        if (flight_attribute != undefined)
            res.push(flight_attribute);
    }
    return res;
}

function split_on_icao24(data: SBS_row[]) : SBS_row[][]{
    let icao24 = {};
    for (let i = 0; i < data.length; i++) {
        let row = data[i];
        if (icao24[row.icao24] == undefined)
            icao24[row.icao24] = [];
        icao24[row.icao24].push(row);
    }

    let result = [];
    for (let key in icao24) {
        let flight_datas = icao24[key];
        if (flight_datas.length > 5) // 5 point minimum
        {
            result.push(flight_datas);
        }
    }
    return result;
}


function getFlightAttrbutes(data: SBS_row[]): MultiADSBMessage
{
    let time:Array<number> = Array();
    let icao24:string =  "";
    let lat:Array<number> =  Array();
    let lon:Array<number> =  Array();
    let velocity:Array<number> =  Array();
    let heading:Array<number> =  Array();
    let vertical_rate:Array<number> =  Array();
    let callsign:string[] =  Array();
    let on_ground:Array<boolean> =  Array();
    let alert:Array<boolean> =  Array();
    let spi:Array<boolean> =  Array();
    let squawk:Array<number> =  Array();
    let baro_altitude:Array<number> =  Array();
    let geo_altitude:Array<number> =  Array();
    let last_pos_update:Array<number> =  Array();
    let last_contact:Array<number> =  Array();
    let hour:Array<number> =  Array();

    // for each message, extract the data
    let current_icao24 = "";
    let current_time = 0;
    let current_callsign = "";
    let current_altitude = "";
    let current_ground_speed = "";
    let current_track = "";
    let current_lat = "";
    let current_lon = "";
    let current_vertrate = "";
    let current_squawk = "";
    let current_alert = "";
    let current_emergency = "";
    let current_spi = "";
    let current_onground = "";

    let current_last_pos_update = 0;
    let current_last_contact = 0;


    for (let i = 0; i < data.length; i++) {
        let pos_updated = false;
        let row = data[i];
        if (current_icao24 != row.icao24 && row.icao24 != "")
            current_icao24 = row.icao24;
        if (current_time != row.time && row.time != 0)
            current_time = row.time;
        if (current_callsign != row.callsign && row.callsign != "")
            current_callsign = row.callsign;
        if (current_altitude != row.altitude && row.altitude != "")
            current_altitude = row.altitude;
        if (current_ground_speed != row.ground_speed && row.ground_speed != "")
            current_ground_speed = row.ground_speed;
        if (current_track != row.track && row.track != "")
            current_track = row.track;
        if (current_lat != row.lat && row.lat != ""){
            current_lat = row.lat;
            pos_updated = true;
        }if (current_lon != row.lon && row.lon != ""){
            current_lon = row.lon;
            pos_updated = true;
        }
        if (current_vertrate != row.vertrate && row.vertrate != "")
            current_vertrate = row.vertrate;
        if (current_squawk != row.squawk && row.squawk != "")
            current_squawk = row.squawk;
        if (current_alert != row.alert && row.alert != "")
            current_alert = row.alert;
        if (current_emergency != row.emergency && row.emergency != "")
            current_emergency = row.emergency;
        if (current_spi != row.spi && row.spi != "")
            current_spi = row.spi;
        if (current_onground != row.onground && row.onground != "")
            current_onground = row.onground;


        if (current_lat != "" && current_lon != "" && current_time != time[time.length - 1]){

            if (current_last_pos_update == 0 && current_last_contact == 0){
                current_last_pos_update = current_time;
                current_last_contact = current_time;
            }

            if (row.msg == "3"){
                current_last_pos_update = current_time;
            }

            current_last_contact = current_time;

            if (pos_updated){
                let t:number = Math.ceil(current_time)
                time.push(t);

                icao24 = current_icao24;
                lat.push(parseFloat(current_lat));
                lon.push(parseFloat(current_lon));
                velocity.push(parseFloat(current_ground_speed));
                heading.push(parseFloat(current_track));
                vertical_rate.push(parseFloat(current_vertrate));
                callsign.push(current_callsign);
                on_ground.push(current_onground == "1");
                alert.push(current_alert == "1");
                spi.push(current_spi == "1");
                squawk.push(parseInt(current_squawk));
                baro_altitude.push(parseFloat(current_altitude));
                geo_altitude.push(parseFloat(current_altitude));

                last_pos_update.push(current_last_pos_update);
                last_contact.push(current_last_contact);
                hour.push(t - t % 3600);
            }
        }
    }

    let indices = [];
    for (let i = 0; i < time.length; i++) {
        indices.push(i);
    }

    // sort the data by time
    indices.sort(function (a, b) { return time[a] - time[b] });

    time = indices.map(function (i) { return time[i] });
    lat = indices.map(function (i) { return lat[i] });
    lon = indices.map(function (i) { return lon[i] });
    velocity = indices.map(function (i) { return velocity[i] });
    heading = indices.map(function (i) { return heading[i] });
    vertical_rate = indices.map(function (i) { return vertical_rate[i] });
    on_ground = indices.map(function (i) { return on_ground[i] });
    alert = indices.map(function (i) { return alert[i] });
    spi = indices.map(function (i) { return spi[i] });
    squawk = indices.map(function (i) { return squawk[i] });
    baro_altitude = indices.map(function (i) { return baro_altitude[i] });
    geo_altitude = indices.map(function (i) { return geo_altitude[i] });
    last_pos_update = indices.map(function (i) { return last_pos_update[i] });
    last_contact = indices.map(function (i) { return last_contact[i] });
    hour = indices.map(function (i) { return hour[i] });


    if (time.length < 5)
    {
        console.log("Flight with ICAO ", icao24, " is too short");

        return undefined;
    }

    return {
        timestamp : time,
        icao24 : icao24,
        latitude : lat,
        longitude : lon,
        groundspeed : velocity,
        track : heading,
        vertical_rate : vertical_rate,
        callsign : callsign,
        onground : on_ground,
        alert : alert,
        spi : spi,
        squawk : squawk,
        altitude : baro_altitude,
        geoaltitude : geo_altitude,
        anomaly : undefined,
    };
}


