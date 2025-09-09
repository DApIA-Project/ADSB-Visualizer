import { LatLng } from "leaflet";

export function timestamp_to_date(timestamp){
    // JJ/MM/AAAA
    var date = new Date(timestamp * 1000);
    var d = date.getDate().toString();
    var m = (date.getMonth() + 1).toString();
    var y = date.getFullYear().toString();

    if (d.length < 2)
        d = '0' + d;
    if (m.length < 2)
        m = '0' + m;

    return d + '/' + m + '/' + y;

}

export function timestamp_to_hhmmss(timestamp){
    // HH:MM:SS
    var date = new Date(timestamp * 1000);
    var h = date.getHours().toString();
    var m = date.getMinutes().toString();
    var s = date.getSeconds().toString();


    if (h.length < 2)
        h = '0' + h;
    if (m.length < 2)
        m = '0' + m;
    if (s.length < 2)
        s = '0' + s;
    return h + ':' + m + ':' + s;
}

export function timestamp_to_date_hour(timestamp){
    return timestamp_to_date(timestamp) + ' ' + timestamp_to_hhmmss(timestamp);
}


export function num_to_hex(num:number):string{
    var hex = num.toString(16);
    if (hex.length < 2)
        hex = '0' + hex;
    return hex;
}

export function float_to_string(value:number, precision:number):string{
    var str = value.toFixed(precision);
    return str;
}


export function createElementFromHTML(htmlString:string):HTMLElement {
    var div:HTMLElement = document.createElement('div');
    div.innerHTML = htmlString.trim();

    // Change this to div.childNodes to support multiple top-level nodes.
    return div.firstChild as HTMLElement;
  }



  export function hash_string(str:string) {
    var hash = 0,
      i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

export function radians(degrees: number): number {
    return degrees * Math.PI / 180;
}

export function degrees(radians: number): number {
    return radians * 180 / Math.PI;
}


export function x_rotation(x: number, y: number, z: number, a: number): [number, number, number] {
    return [x, y * Math.cos(-a) - z * Math.sin(-a), y * Math.sin(-a) + z * Math.cos(-a)];
}

export function y_rotation(x: number, y: number, z: number, a: number): [number, number, number] {
    return [x * Math.cos(-a) + z * Math.sin(-a), y, -x * Math.sin(-a) + z * Math.cos(-a)];
}

export function z_rotation(x: number, y: number, z: number, a: number): [number, number, number] {
    return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z];
}

export function spherical_to_cartesian(lat: number, lon: number): [number, number, number] {
    let x = Math.cos(radians(lon)) * Math.cos(radians(lat));
    let y = Math.sin(radians(lon)) * Math.cos(radians(lat));
    let z = Math.sin(radians(lat));
    return [x, y, z];
}

export function cartesian_to_spherical(x: number, y: number, z: number): [number, number] {
    let lat = degrees(Math.asin(z));
    let lon = degrees(Math.atan2(y, x));
    return [lat, lon];
}

export function distance_m(lat1:number, lon1:number, lat2:number, lon2:number):number{
    lat1 = radians(lat1);
    lon1 = radians(lon1);
    lat2 = radians(lat2);
    lon2 = radians(lon2);

    let dlon = lon2 - lon1;
    let dlat = lat2 - lat1;
    let a = Math.sin(dlat / 2) * Math.sin(dlat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) * Math.sin(dlon / 2);
    let c = 2 * Math.asin(Math.sqrt(a));
    let r = 6371000; // Radius of earth in meters
    return c * r;
}


export function bearing(lat1:number, lon1:number, lat2:number, lon2:number):number{
    lat1 = radians(lat1);
    lon1 = radians(lon1);
    lat2 = radians(lat2);
    lon2 = radians(lon2);

    let y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    let x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    return degrees(Math.atan2(y, x));
}

function lerp(p0:number, p1:number, t:number):number{
    return (1 - t) * p0 + t * p1;
}


function cubic_bezier(p0:number, p1:number, p2:number, p3:number, t:number):number{
    var u = 1 - t;
    return (u * u * u * p0) + (3 * u * u * t * p1) + (3 * u * t * t * p2) + (t * t * t * p3);
}



function normalize_lat_lon(lats:number[], lons:number[]):[number[], number[], number, number]{
    let lenght = lats.length;
    let mid = Math.floor(lenght / 2);
    let Olat = lats[mid];
    let Olon = lons[mid];

    let xs = [...lats];
    let ys = [...lons];

    for (let i = 0; i < lats.length; i++) {
        let [x, y, z] = spherical_to_cartesian(lats[i], lons[i]);
        [x, y, z] = z_rotation(x, y, z, radians(-Olon));
        [x, y, z] = y_rotation(x, y, z, radians(-Olat));
        xs[i] = y;
        ys[i] = z;
    }
    return [xs, ys, Olat, Olon];
}

function denormalize_lat_lon(xs:number[], ys:number[], Olat:number, Olon:number):[number[], number[]]{
    let lats = [...xs];
    let lons = [...ys];

    for (let i = 0; i < xs.length; i++) {
        let [x, y, z] = y_rotation(1, xs[i], ys[i], radians(Olat));
        [x, y, z] = z_rotation(x, y, z, radians(Olon));
        [lats[i], lons[i]] = cartesian_to_spherical(x, y, z);
    }
    return [lats, lons];
}

function symetric_vector(ax, ay, bx, by, vx, vy){
    // v is at the point A
    // construct the symetric vector of v at the point B
    let abx = bx - ax;
    let aby = by - ay;

    let ab_norm = Math.sqrt(abx * abx + aby * aby);
    if (ab_norm < 1e-6)
        return [-vx, -vy];
    abx /= ab_norm;
    aby /= ab_norm;
    let v_norm = Math.sqrt(vx * vx + vy * vy);
    if (v_norm < 1e-6)
        return [-vx, -vy];
    vx /= v_norm;
    vy /= v_norm;
    let dot = vx * abx + vy * aby;
    let sx = vx - 2 * dot * abx;
    let sy = vy - 2 * dot * aby;
    return [sx * v_norm, sy * v_norm];
}



function bezier_interpolate(x:number[], y:number[]) {
    let traj_x = [];
    let traj_y = [];
    const n = 30;

    let params_x = [];
    let params_y = [];

    for (let i = 0; i < x.length; i++) {

        let ax = (i == 0) ? x[i] : x[i - 1];
        let ay = (i == 0) ? y[i] : y[i - 1];
        let bx = x[i];
        let by = y[i];
        let cx = (i == x.length - 1) ? x[i] : x[i + 1];
        let cy = (i == y.length - 1) ? y[i] : y[i + 1];

        let acx = cx - ax;
        let acy = cy - ay;

        let l = Math.sqrt(acx * acx + acy * acy);
        let vx = acx / l
        let vy = acy / l
        params_x.push(vx);
        params_y.push(vy);
    }

    if (x.length >= 3) {
        // make the vector 0, the exact symetric of the vector 1
        // make the vector n-1, the exact symetric of the vector n-2
        let sym = symetric_vector(x[1], y[1], x[0], y[0], params_x[1], params_y[1]);
        params_x[0] = -sym[0];
        params_y[0] = -sym[1];

        sym = symetric_vector(x[x.length - 2], y[y.length - 2], x[x.length - 1], y[y.length - 1], params_x[x.length - 2], params_y[x.length - 2]);
        params_x[x.length - 1] = -sym[0];
        params_y[x.length - 1] = -sym[1];

        // params_x[0] = 0;
        // params_y[0] = 0;
    }

    for (let i = 0; i < x.length - 1; i++) {
        let p0x = x[i];
        let p0y = y[i];
        let p3x = x[i + 1];
        let p3y = y[i + 1];

        let l = Math.sqrt((p3x - p0x) * (p3x - p0x) + (p3y - p0y) * (p3y - p0y));
        let f = l * 1/3;

        let p1x = x[i] + params_x[i] * f;
        let p1y = y[i] + params_y[i] * f;
        let p2x = x[i + 1] - params_x[i + 1] * f;
        let p2y = y[i + 1] - params_y[i + 1] * f;

        for (let j = 0; j <= n; j++) {
            let t = j / n;
            traj_x.push(cubic_bezier(p0x, p1x, p2x, p3x, t));
            traj_y.push(cubic_bezier(p0y, p1y, p2y, p3y, t));
        }
    }


    return [traj_x, traj_y];
}

function linearize_trajectory(x:number[], y:number[], speed:number){
    let lenghts = [0];

    // compute arc length
    for (let i = 1; i < x.length; i++) {
        let dx = x[i] - x[i - 1];
        let dy = y[i] - y[i - 1];
        lenghts.push(distance_m(x[i], y[i], x[i - 1], y[i - 1]) + lenghts[i - 1]);
    }

    // each point is at a distance of speed from the previous point
    let traj_x = [x[0]];
    let traj_y = [y[0]];
    let current_length = 0;

    while (current_length < lenghts[lenghts.length - 1]) {
        // find the segment where the current length is
        let i = 1;
        while (i < lenghts.length && lenghts[i] < current_length) {
            i++;
        }
        if (i >= lenghts.length)
            break;
        // interpolate between points i-1 and i
        let t = (current_length - lenghts[i - 1]) / (lenghts[i] - lenghts[i - 1]);
        traj_x.push(lerp(x[i - 1], x[i], t));
        traj_y.push(lerp(y[i - 1], y[i], t));
        current_length += speed;
    }

    return [traj_x, traj_y];

}


export function waypoints_to_trajectory(lats:number[], lons:number[]){
    let [x, y, Olat, Olon] = normalize_lat_lon(lats, lons);
    console.log(x, y);
    
    let [traj_x, traj_y] = bezier_interpolate(x, y);
    [traj_x, traj_y] = linearize_trajectory(traj_x, traj_y, 2.5);
    let [traj_lat, traj_lon] = denormalize_lat_lon(traj_x, traj_y, Olat, Olon);
    return [traj_lat, traj_lon];
}