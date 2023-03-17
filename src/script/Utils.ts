
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
