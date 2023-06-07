





export function loadFromSBS(filename:string, file_content:string)
{

    // split the file content into lines
    file_content = file_content.trim();
    var lines = file_content.split('\n');
    
    var data:{msg: string;icao24: string;date: string;time: string;callsign: string;altitude: string;ground_speed: string;track: string;lat: string;lon: string;vertrate: string;squawk: string;alert: string;emergency: string;spi: string;onground: string; interpolated:boolean, anomaly: boolean}[] = [];
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim().split(',');

        if (line[0] != "MSG")
            continue;
        line.unshift("");
        
        var row = {
            msg:line[1], // message type
            icao24:line[5], // icao24
            date:line[7], // date
            time:line[8], // time
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
            anomaly:undefined
        }

        data.push(row);
    }
    var data_splited = split_on_icao24(data);

    var res:Array<{
        time: number[];
        icao24: string;
        lat: number[];
        lon: number[];
        velocity: number[];
        heading: number[];
        vertical_rate: number[];
        callsign: string;
        on_ground: boolean[];
        alert: boolean[];
        spi: boolean[];
        squawk: number[];
        baro_altitude: number[];
        geo_altitude: number[];
        last_pos_update: number[];
        last_contact: number[];
        hour: number[];
        start_time: number;
        end_time: number;
        interpolated: boolean[];
        anomaly: boolean[];
    }> = [] 

    for (var flight = 0; flight < data_splited.length; flight++) {
        var flight_data = data_splited[flight];
        var flight_attribute = getFlightAttrbutes(flight_data);
        if (flight_attribute != undefined)
            res.push(flight_attribute);

    }
    return res;
}

function split_on_icao24(data: {msg: string;icao24: string;date: string;time: string;callsign: string;altitude: string;ground_speed: string;track: string;lat: string;lon: string;vertrate: string;squawk: string;alert: string;emergency: string;spi: string;onground: string; interpolated:boolean, anomaly: boolean}[]) : 
{msg: string;icao24: string;date: string;time: string;callsign: string;altitude: string;ground_speed: string;track: string;lat: string;lon: string;vertrate: string;squawk: string;alert: string;emergency: string;spi: string;onground: string; interpolated:boolean, anomaly: boolean}[][]{
    var icao24 = {};
    for (var i = 0; i < data.length; i++) {
        var row = data[i];
        if (icao24[row.icao24] == undefined)
            icao24[row.icao24] = [];
        icao24[row.icao24].push(row);
    }
    
    var result = [];
    for (var key in icao24) {
        var flight_datas = icao24[key];
        if (flight_datas.length > 5) // 5 point minimum
        {
            result.push(flight_datas);
        }
    }
    return result;
}


function getFlightAttrbutes(data: {msg: string;icao24: string;date: string;time: string;callsign: string;altitude: string;ground_speed: string;track: string;lat: string;lon: string;vertrate: string;squawk: string;alert: string;emergency: string;spi: string;onground: string; interpolated:boolean, anomaly: boolean}[])
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

    // for each message, extract the data
    var current_icao24 = "";
    var current_date = "";
    var current_time = "";
    var current_callsign = "";
    var current_altitude = "";
    var current_ground_speed = "";
    var current_track = "";
    var current_lat = "";
    var current_lon = "";
    var current_vertrate = "";
    var current_squawk = "";
    var current_alert = "";
    var current_emergency = "";
    var current_spi = "";
    var current_onground = "";

    var current_last_pos_update = 0;
    var current_last_contact = 0;

    for (var i = 0; i < data.length; i++) {
        var pos_updated = false;
        var row = data[i];
        if (current_icao24 != row.icao24 && row.icao24 != "")
            current_icao24 = row.icao24;
        if (current_date != row.date && row.date != "")
            current_date = row.date;
        if (current_time != row.time && row.time != "")
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

        
        if (current_lat != "" && current_lon != ""){
            var date = new Date(current_date);
            var time_split = current_time.split(":");
            var timestamp = 0;
            if (time_split.length == 3)
                timestamp =new Date(date.getFullYear(), date.getMonth(), date.getDate(), parseInt(time_split[0]), parseInt(time_split[1]), parseInt(time_split[2])).getTime() / 1000;
            else if (time_split.length == 2)
                timestamp =new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, parseInt(time_split[0]), parseInt(time_split[1])).getTime() / 1000;
                
            if (current_last_pos_update == 0 && current_last_contact == 0){
                current_last_pos_update = timestamp;
                current_last_contact = timestamp;
            }

            if (row.msg == "3"){
                current_last_pos_update = timestamp;
            }

            current_last_contact = timestamp;
            
            if (pos_updated){
                var t:number = Math.ceil(timestamp)
                time.push(t);

                icao24 = current_icao24;
                lat.push(parseFloat(current_lat));
                lon.push(parseFloat(current_lon));
                velocity.push(parseFloat(current_ground_speed));
                heading.push(parseFloat(current_track));
                vertical_rate.push(parseFloat(current_vertrate));
                callsign = current_callsign;
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

    start_time = time[0];
    end_time = time[time.length - 1];

    var indices = [];
    for (var i = 0; i < time.length; i++) {
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
        return undefined;    

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
        interpolated : undefined,
        anomaly : undefined,
    };
}


